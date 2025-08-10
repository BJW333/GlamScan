import { schema, OutputType } from "./toggle_POST.schema";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const json = superjson.parse(await request.text());
    const { itemId, itemType } = schema.parse(json);

    const existingSave = await db
      .selectFrom("savedItems")
      .selectAll()
      .where("userId", "=", user.id)
      .where("itemId", "=", itemId)
      .where("itemType", "=", itemType)
      .limit(1)
      .executeTakeFirst();

    if (existingSave) {
      // Item is already saved, so unsave it
      await db
        .deleteFrom("savedItems")
        .where("id", "=", existingSave.id)
        .execute();
      
      console.log(`Item unsaved: { userId: ${user.id}, itemId: ${itemId}, itemType: '${itemType}' }`);
      return new Response(
        superjson.stringify({ saved: false } satisfies OutputType),
        { headers: { "Content-Type": "application/json" } }
      );
    } else {
      // Item is not saved, so save it
      await db
        .insertInto("savedItems")
        .values({
          userId: user.id,
          itemId: itemId,
          itemType: itemType,
        })
        .execute();

      console.log(`Item saved: { userId: ${user.id}, itemId: ${itemId}, itemType: '${itemType}' }`);
      return new Response(
        superjson.stringify({ saved: true } satisfies OutputType),
        { headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error toggling saved item:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}