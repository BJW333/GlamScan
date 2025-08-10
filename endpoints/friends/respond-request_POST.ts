import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./respond-request_POST.schema";
import superjson from "superjson";
import { sql } from "kysely";

export async function handle(request: Request): Promise<Response> {
  try {
    const { user: addressee } = await getServerUserSession(request);
    const json = superjson.parse(await request.text());
    const { requesterId, action } = schema.parse(json);

    const friendRequest = await db
      .selectFrom("friends")
      .selectAll()
      .where("requesterId", "=", requesterId)
      .where("addresseeId", "=", addressee.id)
      .where("status", "=", "pending")
      .executeTakeFirst();

    if (!friendRequest) {
      throw new Error("Friend request not found or already handled.");
    }

    await db.transaction().execute(async (trx) => {
      switch (action) {
        case "accept":
          await trx
            .updateTable("friends")
            .set({ status: "accepted", updatedAt: new Date() })
            .where("id", "=", friendRequest.id)
            .execute();

          // Notify original requester
          await trx
            .insertInto("notifications")
            .values({
              userId: requesterId,
              type: "friend_accepted",
              title: "Friend Request Accepted",
              message: `${addressee.displayName} accepted your friend request.`,
              data: {
                accepterId: addressee.id,
                accepterName: addressee.displayName,
              },
            })
            .execute();
          break;

        case "decline":
          await trx
            .deleteFrom("friends")
            .where("id", "=", friendRequest.id)
            .execute();
          break;

        case "block":
          // Delete the pending request first
          await trx
            .deleteFrom("friends")
            .where("id", "=", friendRequest.id)
            .execute();

          // Create a new block relationship, initiated by the current user
          await trx
            .insertInto("friends")
            .values({
              requesterId: addressee.id, // The blocker is the requester in a block relationship
              addresseeId: requesterId,
              status: "blocked",
            })
            // In case a block already exists in the other direction, update it.
            .onConflict((oc) =>
              oc
                .columns(["requesterId", "addresseeId"])
                .doUpdateSet({ status: "blocked", updatedAt: new Date() })
            )
            .execute();
          break;
      }
    });

    const output: OutputType = { success: true, action };
    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error responding to friend request:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}