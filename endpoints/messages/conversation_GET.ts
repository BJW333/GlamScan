import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./conversation_GET.schema";
import superjson from "superjson";
import { sql } from "kysely";

export async function handle(request: Request) {
  const url = new URL(request.url);
  const rawInput = {
    conversationId: url.searchParams.get("conversationId"),
    cursor: url.searchParams.get("cursor"),
    limit: url.searchParams.get("limit"),
  };

  try {
    const { user } = await getServerUserSession(request);
    const userId = user.id;

    const input = schema.parse({
      conversationId: rawInput.conversationId
        ? Number(rawInput.conversationId)
        : undefined,
      cursor: rawInput.cursor,
      limit: rawInput.limit ? Number(rawInput.limit) : undefined,
    });

    const { conversationId, cursor, limit = 20 } = input;

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

    let messagesQuery = db
      .selectFrom("messages")
      .selectAll()
      .where("conversationId", "=", conversationId)
      .orderBy("createdAt", "desc")
      .limit(limit + 1); // Fetch one extra to determine next cursor

    if (cursor) {
      messagesQuery = messagesQuery.where("createdAt", "<", new Date(cursor));
    }

    const messages = await messagesQuery.execute();

    let nextCursor: string | null = null;
    if (messages.length > limit) {
      const nextMessage = messages.pop();
      if (nextMessage && nextMessage.createdAt) {
        nextCursor = nextMessage.createdAt.toISOString();
      }
    }

    // Mark fetched messages as read
    if (messages.length > 0) {
      const messageIds = messages.map((m) => m.id);
      await db
        .updateTable("messages")
        .set({
          readBy: sql`read_by || ${JSON.stringify([userId])}`,
        })
        .where("id", "in", messageIds)
        .where(sql`NOT(read_by ? ${userId.toString()})`)
        .execute();
    }

    const response: OutputType = {
      messages,
      nextCursor,
    };

    return new Response(superjson.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}