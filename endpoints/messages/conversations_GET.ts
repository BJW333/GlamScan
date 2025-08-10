import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { OutputType } from "./conversations_GET.schema";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const userId = user.id;

    // Step 1: Get all conversations for the user
    const conversations = await db
      .selectFrom("conversationParticipants as cp")
      .where("cp.userId", "=", userId)
      .innerJoin("conversations as c", "c.id", "cp.conversationId")
      .select(["c.id as conversationId", "c.updatedAt"])
      .orderBy("c.updatedAt", "desc")
      .execute();

    if (conversations.length === 0) {
      return new Response(superjson.stringify([] satisfies OutputType), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const conversationIds = conversations.map((c) => c.conversationId);

    // Step 2: Get last message for each conversation
    const lastMessages = await db
      .selectFrom("messages")
      .select(["conversationId", "content", "senderId", "createdAt"])
      .where("conversationId", "in", conversationIds)
      .orderBy("createdAt", "desc")
      .execute();

    // Group last messages by conversation ID (first message is the latest due to order by)
    const lastMessageMap = new Map();
    for (const message of lastMessages) {
      if (!lastMessageMap.has(message.conversationId)) {
        lastMessageMap.set(message.conversationId, message);
      }
    }

    // Step 3: Get participants for each conversation
    const participants = await db
      .selectFrom("conversationParticipants as cp")
      .innerJoin("users as u", "u.id", "cp.userId")
      .where("cp.conversationId", "in", conversationIds)
      .where("cp.userId", "!=", userId)
      .select([
        "cp.conversationId",
        "u.id",
        "u.displayName",
        "u.avatarUrl",
      ])
      .execute();

    // Group participants by conversation ID
    const participantMap = new Map();
    for (const participant of participants) {
      if (!participantMap.has(participant.conversationId)) {
        participantMap.set(participant.conversationId, []);
      }
      participantMap.get(participant.conversationId).push({
        id: participant.id,
        displayName: participant.displayName,
        avatarUrl: participant.avatarUrl,
      });
    }

    // Step 4: Get unread counts for each conversation
    const unreadCounts = await db
      .selectFrom("messages")
      .select([
        "conversationId",
        db.fn.count<number>("id").as("count"),
      ])
      .where("conversationId", "in", conversationIds)
      .where("senderId", "!=", userId)
      .where((eb) =>
        eb.not(
          eb.fn<boolean>("jsonb_exists", ["readBy", eb.val(userId.toString())])
        )
      )
      .groupBy("conversationId")
      .execute();

    // Create unread count map
    const unreadCountMap = new Map();
    for (const count of unreadCounts) {
      unreadCountMap.set(count.conversationId, Number(count.count));
    }

    // Step 5: Combine all data into the expected format
    const response: OutputType = conversations.map((conversation) => {
      const lastMessage = lastMessageMap.get(conversation.conversationId);
      const conversationParticipants = participantMap.get(conversation.conversationId) || [];
      const unreadCount = unreadCountMap.get(conversation.conversationId) || 0;

      return {
        conversationId: conversation.conversationId,
        participants: conversationParticipants,
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              senderId: lastMessage.senderId,
              createdAt: lastMessage.createdAt,
            }
          : null,
        unreadCount: unreadCount,
      };
    });

    return new Response(superjson.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}