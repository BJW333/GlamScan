import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { SavedItemListFilters, OutputType, SavedItemType } from "./list_GET.schema";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    // Get authenticated user
    const { user } = await getServerUserSession(request);

    // Parse query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    const { page, pageSize } = SavedItemListFilters.parse(queryParams);
    const offset = (page - 1) * pageSize;

    // Get total count and saved items in parallel for better performance
    const [totalCountResult, savedItemsQuery] = await Promise.all([
      db
        .selectFrom("savedItems")
        .select(db.fn.count<number>("id").as("count"))
        .where("userId", "=", user.id)
        .executeTakeFirst(),
      
      db
        .selectFrom("savedItems")
        .select(["itemId", "itemType", "createdAt"])
        .where("userId", "=", user.id)
        .orderBy("createdAt", "desc")
        .limit(pageSize)
        .offset(offset)
        .execute()
    ]);
    
    const totalCount = totalCountResult?.count ?? 0;

    // Separate post and style combo IDs for batch queries
    const postIds: number[] = [];
    const styleComboIds: number[] = [];
    
    savedItemsQuery.forEach(item => {
      if (item.itemType === "post") {
        postIds.push(item.itemId);
      } else if (item.itemType === "style_combo") {
        styleComboIds.push(item.itemId);
      }
    });

    // Batch fetch posts and style combos to eliminate N+1 queries
    const [posts, styleCombos, styleComboItems] = await Promise.all([
      // Fetch all posts in one query
      postIds.length > 0 
        ? db
            .selectFrom("posts")
            .select([
              "id",
              "userId", 
              "imageUrl",
              "caption",
              "productTags",
              "createdAt",
              "updatedAt"
            ])
            .where("id", "in", postIds)
            .where("createdAt", "is not", null)
            .execute()
        : Promise.resolve([]),
      
      // Fetch all style combos in one query
      styleComboIds.length > 0
        ? db
            .selectFrom("styleCombos")
            .select([
              "id",
              "title",
              "description", 
              "coverImageUrl",
              "shopUrl",
              "totalPrice",
              "season",
              "occasion",
              "style",
              "isSponsored",
              "createdAt",
              "updatedAt"
            ])
            .where("id", "in", styleComboIds)
            .where("createdAt", "is not", null)
            .execute()
        : Promise.resolve([]),
      
      // Fetch all style combo items in one query
      styleComboIds.length > 0
        ? db
            .selectFrom("styleComboItems")
            .select([
              "id",
              "comboId",
              "name",
              "imageUrl", 
              "affiliateUrl",
              "price",
              "itemOrder",
              "createdAt"
            ])
            .where("comboId", "in", styleComboIds)
            .where("createdAt", "is not", null)
            .orderBy("itemOrder", "asc")
            .execute()
        : Promise.resolve([])
    ]);

    // Create lookup maps for efficient access
    const postMap = new Map(posts.map(post => [post.id, post]));
    const styleComboMap = new Map(styleCombos.map(combo => [combo.id, combo]));
    
    // Group style combo items by combo ID
    const styleComboItemsMap = new Map<number, typeof styleComboItems>();
    styleComboItems.forEach(item => {
      if (!styleComboItemsMap.has(item.comboId)) {
        styleComboItemsMap.set(item.comboId, []);
      }
      styleComboItemsMap.get(item.comboId)!.push(item);
    });

    // Build saved items array maintaining original order
    const savedItems: SavedItemType[] = [];

    for (const savedItem of savedItemsQuery) {
      if (savedItem.itemType === "post") {
        const post = postMap.get(savedItem.itemId);
        if (post && post.createdAt) {
          savedItems.push({
            itemType: "post",
            id: post.id,
            userId: post.userId,
            imageUrl: post.imageUrl,
            caption: post.caption,
            productTags: post.productTags,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt
          });
        }
      } else if (savedItem.itemType === "style_combo") {
        const styleCombo = styleComboMap.get(savedItem.itemId);
        if (styleCombo && styleCombo.createdAt) {
          const comboItems = styleComboItemsMap.get(styleCombo.id) || [];
          
          savedItems.push({
            itemType: "style_combo",
            id: styleCombo.id,
            title: styleCombo.title,
            description: styleCombo.description,
            coverImageUrl: styleCombo.coverImageUrl,
            shopUrl: styleCombo.shopUrl,
            totalPrice: styleCombo.totalPrice,
            season: styleCombo.season,
            occasion: styleCombo.occasion,
            style: styleCombo.style,
            isSponsored: styleCombo.isSponsored,
            createdAt: styleCombo.createdAt,
            updatedAt: styleCombo.updatedAt,
            items: comboItems.map(item => ({
              id: item.id,
              comboId: item.comboId,
              name: item.name,
              imageUrl: item.imageUrl,
              affiliateUrl: item.affiliateUrl,
              price: item.price,
              itemOrder: item.itemOrder,
              createdAt: item.createdAt as Date
            }))
          });
        }
      }
    }

    const response: OutputType = {
      savedItems,
      totalCount,
      page,
      pageSize
    };

    return new Response(superjson.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error fetching saved items:", error);
    
    if (error instanceof Error) {
      return new Response(
        superjson.stringify({ error: error.message }), 
        { 
          status: error.name === "NotAuthenticatedError" ? 401 : 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    return new Response(
      superjson.stringify({ error: "Failed to fetch saved items" }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}