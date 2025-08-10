import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./list_GET.schema";
import superjson from "superjson";
import { sql } from "kysely";

export async function handle(request: Request): Promise<Response> {
  try {
    const { user } = await getServerUserSession(request);
    const url = new URL(request.url);
    const { filter } = schema.parse({
      filter: url.searchParams.get("filter") ?? "all",
    });

    let query = db
      .selectFrom("friends")
      .innerJoin("users as otherUser", (join) =>
        join.on((eb) =>
          eb.or([
            eb.and([
              eb("friends.requesterId", "=", user.id),
              eb("otherUser.id", "=", eb.ref("friends.addresseeId")),
            ]),
            eb.and([
              eb("friends.addresseeId", "=", user.id),
              eb("otherUser.id", "=", eb.ref("friends.requesterId")),
            ]),
          ])
        )
      )
      .select([
        "otherUser.id",
        "otherUser.displayName",
        "otherUser.avatarUrl",
        "friends.status",
        "friends.requesterId",
      ]);

    switch (filter) {
      case "all":
        query = query
          .where("friends.status", "=", "accepted")
          .where((eb) =>
            eb.or([
              eb("friends.requesterId", "=", user.id),
              eb("friends.addresseeId", "=", user.id),
            ])
          );
        break;
      case "pending_sent":
        query = query
          .where("friends.status", "=", "pending")
          .where("friends.requesterId", "=", user.id);
        break;
      case "pending_received":
        query = query
          .where("friends.status", "=", "pending")
          .where("friends.addresseeId", "=", user.id);
        break;
      case "blocked":
        query = query
          .where("friends.status", "=", "blocked")
          .where("friends.requesterId", "=", user.id);
        break;
    }

    const friends = await query.execute();

    const output: OutputType = friends.map((friend) => ({
      id: friend.id,
      displayName: friend.displayName,
      avatarUrl: friend.avatarUrl,
      // For pending_received, we need to show the requester's ID
      // For other cases, the 'other' user's ID is what we want.
      // The query is structured to always return the 'other' user's details.
      // For pending_received, the requesterId is the other user.
      requesterId: filter === 'pending_received' ? friend.requesterId : undefined,
    }));

    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching friends list:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}