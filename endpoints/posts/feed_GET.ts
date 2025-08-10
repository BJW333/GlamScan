import { db } from "../../helpers/db";
import { schema, OutputType } from "./feed_GET.schema";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import superjson from "superjson";
import { sql } from "kysely";

export async function handle(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const input = schema.parse({
      limit: url.searchParams.get("limit")
        ? parseInt(url.searchParams.get("limit") as string, 10)
        : undefined,
      cursor: url.searchParams.get("cursor")
        ? parseInt(url.searchParams.get("cursor") as string, 10)
        : undefined,
    });

    const limit = input.limit ?? 10;
    let user;
    try {
      const session = await getServerUserSession(request);
      user = session.user;
    } catch (e) {
      if (e instanceof NotAuthenticatedError) {
        user = null; // User is not logged in, proceed without user-specific data
      } else {
        throw e; // Re-throw other errors
      }
    }

    // Build optimized query with proper joins and aggregations
    let query = db
      .selectFrom("posts")
      .innerJoin("users", "posts.userId", "users.id")
      .leftJoin("votes as upvote_votes", (join) =>
        join
          .onRef("upvote_votes.postId", "=", "posts.id")
          .on("upvote_votes.voteType", "=", "upvote")
      )
      .leftJoin("votes as downvote_votes", (join) =>
        join
          .onRef("downvote_votes.postId", "=", "posts.id")
          .on("downvote_votes.voteType", "=", "downvote")
      )
      .select([
        "posts.id",
        "posts.imageUrl",
        "posts.caption",
        "posts.productTags",
        "posts.createdAt",
        "users.id as authorId",
        "users.displayName as authorDisplayName",
        "users.avatarUrl as authorAvatarUrl",
        // Use aggregation instead of subqueries for better performance
        (eb) => eb.fn.count("upvote_votes.id").as("upvotes"),
        (eb) => eb.fn.count("downvote_votes.id").as("downvotes"),
      ])
      .groupBy([
        "posts.id",
        "posts.imageUrl", 
        "posts.caption",
        "posts.productTags",
        "posts.createdAt",
        "users.id",
        "users.displayName",
        "users.avatarUrl",
      ]);

    // Add user-specific vote information if authenticated
    if (user) {
      query = query
        .leftJoin("votes as user_votes", (join) =>
          join
            .onRef("user_votes.postId", "=", "posts.id")
            .on("user_votes.userId", "=", user!.id)
        )
        .select("user_votes.voteType as currentUserVote")
        .groupBy("user_votes.voteType");
    }

    // Implement cursor-based pagination with proper indexing
    if (input.cursor) {
      // Use cursor directly for better performance - posts.id is indexed
      query = query.where("posts.id", "<", input.cursor);
    }

    const posts = await query
      .orderBy("posts.id", "desc") // Use indexed column for better performance
      .limit(limit)
      .execute();

    const formattedPosts = posts.map((p) => ({
      ...p,
      upvotes: Number(p.upvotes) || 0,
      downvotes: Number(p.downvotes) || 0,
      currentUserVote: (p as any).currentUserVote ?? null,
    }));

    const nextCursor =
      posts.length === limit ? posts[posts.length - 1].id : null;

    return new Response(
      superjson.stringify({ posts: formattedPosts, nextCursor } satisfies OutputType)
    );
  } catch (error) {
    console.error("Error fetching post feed:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}