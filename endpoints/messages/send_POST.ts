import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./send_POST.schema";
import { messageRateLimiter } from "../../helpers/rateLimiter";
import { validateJsonInput, validateTextContent, addSecurityHeaders, createSafeErrorResponse, ValidationError } from "../../helpers/inputValidator";
import superjson from "superjson";
import { sql } from "kysely";

export async function handle(request: Request) {
  try {
    // Rate limiting
    const rateLimitResult = await messageRateLimiter.checkLimit(request);
    if (!rateLimitResult.allowed) {
      return createSafeErrorResponse(
        new Error("Too many requests"),
        "Too many message attempts. Please try again later.",
        429
      );
    }

    // Session validation
    const { user } = await getServerUserSession(request);
    
    // Verify user exists and has proper permissions
    if (!user || !user.id) {
      return createSafeErrorResponse(
        new ValidationError("Authentication required"),
        "Authentication required",
        401
      );
    }
    
    const userId = user.id;

    // Validate and parse JSON input
    const input = await validateJsonInput(request, schema);

    // Sanitize message content
    const sanitizedContent = validateTextContent(input.content, 2000);

    // Validate metadata if provided
    let validatedMetadata = null;
    if (input.metadata) {
      try {
        const metadataString = JSON.stringify(input.metadata);
        if (metadataString.length > 5000) { // 5KB limit for metadata
          throw new ValidationError("Message metadata is too large");
        }
        validatedMetadata = input.metadata;
      } catch (error) {
        throw new ValidationError("Invalid message metadata format");
      }
    }

    let conversationId = input.conversationId;

    // If no conversationId, it's a new DM. Create one.
    if (!conversationId) {
      if (!input.recipientId) {
        throw new ValidationError("recipientId is required for a new conversation.");
      }
      if (input.recipientId === userId) {
        throw new ValidationError("Cannot start a conversation with yourself.");
      }

      // Verify recipient exists
      const recipient = await db
        .selectFrom("users")
        .select("id")
        .where("id", "=", input.recipientId)
        .executeTakeFirst();

      if (!recipient) {
        throw new ValidationError("Recipient not found.");
      }

      const participantIds = [userId, input.recipientId].sort((a, b) => a - b);

      // Check if a conversation already exists between these two users
      const existingConversation = await db
        .selectFrom("conversationParticipants as cp1")
        .innerJoin(
          "conversationParticipants as cp2",
          "cp1.conversationId",
          "cp2.conversationId"
        )
        .where("cp1.userId", "=", participantIds[0])
        .where("cp2.userId", "=", participantIds[1])
        .select("cp1.conversationId")
        .executeTakeFirst();

      if (existingConversation) {
        conversationId = existingConversation.conversationId;
      } else {
        // Create new conversation in a transaction
        const newConversation = await db.transaction().execute(async (trx) => {
          const conv = await trx
            .insertInto("conversations")
            .values({})
            .returning("id")
            .executeTakeFirstOrThrow();

          await trx
            .insertInto("conversationParticipants")
            .values(
              participantIds.map((id) => ({
                conversationId: conv.id,
                userId: id,
              }))
            )
            .execute();

          return conv;
        });
        conversationId = newConversation.id;
      }
    } else {
      // Verify user is a participant of the existing conversation
      const participant = await db
        .selectFrom("conversationParticipants")
        .where("conversationId", "=", conversationId)
        .where("userId", "=", userId)
        .select("id")
        .limit(1)
        .executeTakeFirst();

      if (!participant) {
        return createSafeErrorResponse(
          new ValidationError("Not a participant of this conversation"),
          "Not authorized to send messages in this conversation",
          403
        );
      }
    }

    // Insert the new message
    const newMessage = await db.transaction().execute(async (trx) => {
      const msg = await trx
        .insertInto("messages")
        .values({
          conversationId: conversationId!,
          senderId: userId,
          content: sanitizedContent,
          messageType: input.messageType,
          metadata: validatedMetadata,
          readBy: sql`to_jsonb(ARRAY[${userId.toString()}])`, // Sender has read it
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // Update conversation's updatedAt timestamp to bring it to the top of the list
      await trx
        .updateTable("conversations")
        .set({ updatedAt: new Date() })
        .where("id", "=", conversationId!)
        .execute();

      return msg;
    });

    const response: OutputType = newMessage;

    const responseObj = new Response(superjson.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });

    return addSecurityHeaders(responseObj);
  } catch (error) {
    return createSafeErrorResponse(error, "Failed to send message", 400);
  }
}