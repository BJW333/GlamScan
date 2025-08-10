import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./mark-read_POST.schema";
import superjson from "superjson";

export async function handle(request: Request): Promise<Response> {
  try {
    const { user } = await getServerUserSession(request);
    const json = superjson.parse(await request.text());
    const { notificationIds } = schema.parse(json);

    if (notificationIds.length === 0) {
      const output: OutputType = {
        success: true,
        updatedCount: 0,
      };
      return new Response(superjson.stringify(output));
    }

    const result = await db
      .updateTable("notifications")
      .set({ isRead: true })
      .where("userId", "=", user.id)
      .where("id", "in", notificationIds)
      .where("isRead", "=", false)
      .executeTakeFirst();

    const updatedCount = Number(result.numUpdatedRows);

    const output: OutputType = {
      success: true,
      updatedCount,
    };

    return new Response(superjson.stringify(output));
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}