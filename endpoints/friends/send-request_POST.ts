import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./send-request_POST.schema";
import superjson from "superjson";
import { sql } from "kysely";

export async function handle(request: Request): Promise<Response> {
  try {
    const { user: requester } = await getServerUserSession(request);
    const json = superjson.parse(await request.text());
    const { addresseeId } = schema.parse(json);

    if (requester.id === addresseeId) {
      throw new Error("You cannot send a friend request to yourself.");
    }

    // Check if a relationship already exists
    const existingRelationship = await db
      .selectFrom("friends")
      .selectAll()
      .where((eb) =>
        eb.or([
          eb.and([
            eb("requesterId", "=", requester.id),
            eb("addresseeId", "=", addresseeId),
          ]),
          eb.and([
            eb("requesterId", "=", addresseeId),
            eb("addresseeId", "=", requester.id),
          ]),
        ])
      )
      .limit(1)
      .executeTakeFirst();

    if (existingRelationship) {
      let message = "A relationship with this user already exists.";
      if (existingRelationship.status === "accepted") {
        message = "You are already friends with this user.";
      } else if (existingRelationship.status === "pending") {
        message = "A friend request is already pending with this user.";
      } else if (existingRelationship.status === "blocked") {
        if (existingRelationship.requesterId === requester.id) {
          message = "You have blocked this user.";
        } else {
          message = "You cannot send a request to this user.";
        }
      }
      throw new Error(message);
    }

    // Create friend request
    await db.transaction().execute(async (trx) => {
      await trx
        .insertInto("friends")
        .values({
          requesterId: requester.id,
          addresseeId: addresseeId,
          status: "pending",
        })
        .execute();

      // Create notification for the recipient
      await trx
        .insertInto("notifications")
        .values({
          userId: addresseeId,
          type: "friend_request",
          title: "New Friend Request",
          message: `${requester.displayName} sent you a friend request.`,
          data: {
            requesterId: requester.id,
            requesterName: requester.displayName,
          },
        })
        .execute();
    });

    const output: OutputType = { success: true };
    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending friend request:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}