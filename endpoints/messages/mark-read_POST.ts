import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./mark-read_POST.schema";
import superjson from "superjson";
import { sql } from "kysely";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const userId = user.id;

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);
    const { conversationId } = input;

    // Verify user is a participant
    const participant = await db
      .selectFrom("conversationParticipants")
      .where("conversationId", "=", conversationId)
      .where("userId", "=", userId)
      .select("id")
      .limit(1)
      .executeTakeFirst();

    if (!participant) {
      return new Response(
        superjson.stringify({ error: "Not a participant of this conversation" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await db
      .updateTable("messages")
      .set({
        readBy: sql`read_by || ${JSON.stringify([userId])}`,
      })
      .where("conversationId", "=", conversationId)
      .where("senderId", "!=", userId)
      .where(sql`NOT(read_by ? ${userId.toString()})`)
      .returning("id")
      .execute();

    const response: OutputType = {
      success: true,
      markedAsReadCount: result.length,
    };

    return new Response(superjson.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}