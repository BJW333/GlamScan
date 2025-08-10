import { db } from "../../helpers/db";
import { StyleComboListFilters } from "./list_GET.schema";
import { Selectable, sql } from "kysely";
import type { StyleComboItems } from "../../helpers/schema";
import { generalRateLimiter } from "../../helpers/rateLimiter";
import { addSecurityHeaders, createSafeErrorResponse, applyRateLimiting } from "../../helpers/security";
import { handleNetworkError, getAbortSignalWithTimeout, REQUEST_TIMEOUT_MS } from "../../helpers/networkDefaults";
import { addAffiliateTag } from "../../helpers/affiliate";

export async function handle(request: Request) {
  try {
    // Apply rate limiting
    await applyRateLimiting(request, generalRateLimiter);

    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    // Parse and validate query parameters
    const params = StyleComboListFilters.parse(queryParams);
    
    // Use AbortSignal for timeout handling
    const signal = getAbortSignalWithTimeout(REQUEST_TIMEOUT_MS);
    
    // Build optimized two-query approach for better performance
    // First query: Get style combos with pagination
    let baseQuery = db
      .selectFrom("styleCombos")
      .select([
        "styleCombos.id",
        "styleCombos.title",
        "styleCombos.description", 
        "styleCombos.coverImageUrl",
        "styleCombos.shopUrl",
        "styleCombos.totalPrice",
        "styleCombos.season",
        "styleCombos.occasion",
        "styleCombos.style",
        "styleCombos.createdAt",
        "styleCombos.updatedAt"
        // Note: isSponsored is excluded for security (hidden from public)
      ]);

    // Apply filters
    if (params.season) {
      baseQuery = baseQuery.where("styleCombos.season", "=", params.season);
    }
    
    if (params.occasion) {
      baseQuery = baseQuery.where("styleCombos.occasion", "=", params.occasion);
    }
    
    if (params.style) {
      baseQuery = baseQuery.where("styleCombos.style", "=", params.style);
    }
    
    if (params.search) {
      const searchTerm = `%${params.search}%`;
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          eb("styleCombos.title", "ilike", searchTerm),
          eb("styleCombos.description", "ilike", searchTerm),
        ])
      );
    }

    // Get total count efficiently with same filters
    let countQuery = db
      .selectFrom("styleCombos")
      .select(db.fn.countAll<number>().as("count"));

    // Apply the same filters to count query
    if (params.season) {
      countQuery = countQuery.where("season", "=", params.season);
    }
    
    if (params.occasion) {
      countQuery = countQuery.where("occasion", "=", params.occasion);
    }
    
    if (params.style) {
      countQuery = countQuery.where("style", "=", params.style);
    }
    
    if (params.search) {
      const searchTerm = `%${params.search}%`;
      countQuery = countQuery.where((eb) =>
        eb.or([
          eb("title", "ilike", searchTerm),
          eb("description", "ilike", searchTerm),
        ])
      );
    }

    // Execute both queries in parallel for better performance
    const [totalCountResult, combos] = await Promise.all([
      countQuery.executeTakeFirstOrThrow(),
      baseQuery
        .orderBy("styleCombos.createdAt", "desc")
        .limit(params.pageSize)
        .offset((params.page - 1) * params.pageSize)
        .execute()
    ]);

    const totalCount = totalCountResult.count;

    // Second query: Get items for the retrieved combos (more efficient than JSON_AGG)
    const comboIds = combos.map(combo => combo.id);
    const items = comboIds.length > 0 ? await db
      .selectFrom("styleComboItems")
      .select([
        "comboId",
        "name",
        "price",
        "imageUrl",
        "affiliateUrl",
        "itemOrder"
        // Note: id is excluded for security (internal data hidden from public)
      ])
      .where("comboId", "in", comboIds)
      .orderBy("itemOrder", "asc")
      .execute() : [];

    // Group items by combo ID for efficient lookup
    const itemsByComboId = new Map<number, typeof items>();
    items.forEach(item => {
      if (!itemsByComboId.has(item.comboId)) {
        itemsByComboId.set(item.comboId, []);
      }
      itemsByComboId.get(item.comboId)!.push(item);
    });

    // Process results with URL sanitization and affiliate monetization
    const styleCombos = combos.map((combo) => {
      const comboItems = itemsByComboId.get(combo.id) || [];
      
      return {
        id: combo.id,
        title: combo.title,
        description: combo.description,
        coverImageUrl: combo.coverImageUrl,
        shopUrl: addAffiliateTag(combo.shopUrl), // Ensure affiliate monetization
        totalPrice: combo.totalPrice,
        season: combo.season,
        occasion: combo.occasion,
        style: combo.style,
        createdAt: combo.createdAt,
        updatedAt: combo.updatedAt,
        items: comboItems.map(item => ({
          comboId: item.comboId,
          name: item.name,
          price: item.price,
          imageUrl: item.imageUrl,
          affiliateUrl: addAffiliateTag(item.affiliateUrl), // Ensure affiliate monetization
          itemOrder: item.itemOrder || 0,
        })),
      };
    });

    const response = {
      styleCombos,
      totalCount,
      page: params.page,
      pageSize: params.pageSize,
    };

    const jsonResponse = new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });

    return addSecurityHeaders(jsonResponse);
  } catch (error) {
    // Handle rate limiting responses
    if (error instanceof Response) {
      return addSecurityHeaders(error);
    }

    handleNetworkError(error, "Style combos list");
    
    if (error instanceof Error) {
      return addSecurityHeaders(createSafeErrorResponse(
        error,
        "Failed to fetch style combos",
        400
      ));
    }
    
    return addSecurityHeaders(createSafeErrorResponse(
      error,
      "Internal server error",
      500
    ));
  }
}