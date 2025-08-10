import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./search_GET.schema";
import superjson from "superjson";
import { sql } from "kysely";

export async function handle(request: Request): Promise<Response> {
  try {
    const { user } = await getServerUserSession(request);
    const url = new URL(request.url);
    const { query: searchTerm } = schema.parse({
      query: url.searchParams.get("query"),
    });

    if (searchTerm.length < 2) {
      return new Response(superjson.stringify([] satisfies OutputType), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const searchResults = await db
      .selectFrom("users")
      .leftJoin("friends", (join) =>
        join.on((eb) =>
          eb.or([
            eb.and([
              eb("friends.requesterId", "=", user.id),
              eb("friends.addresseeId", "=", eb.ref("users.id")),
            ]),
            eb.and([
              eb("friends.addresseeId", "=", user.id),
              eb("friends.requesterId", "=", eb.ref("users.id")),
            ]),
          ])
        )
      )
      .select([
        "users.id",
        "users.displayName",
        "users.email",
        "users.avatarUrl",
        "friends.status",
        "friends.requesterId",
      ])
      .where("users.id", "!=", user.id)
      .where((eb) =>
        eb.or([
          eb("users.displayName", "ilike", `%${searchTerm}%`),
          eb("users.email", "ilike", `%${searchTerm}%`),
        ])
      )
      // Exclude users who have blocked the current user
      .where((eb) =>
        eb.or([
          eb("friends.status", "is", null),
          eb.and([
            eb("friends.status", "=", "blocked"),
            eb("friends.requesterId", "=", user.id), // Can see users you blocked
          ]),
          eb("friends.status", "!=", "blocked"),
        ])
      )
      .limit(20)
      .execute();

    const output: OutputType = searchResults.map((result) => ({
      id: result.id,
      displayName: result.displayName,
      avatarUrl: result.avatarUrl,
      friendStatus: result.status,
      isRequestSentByMe: result.status === 'pending' && result.requesterId === user.id,
    }));

    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error searching for users:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}