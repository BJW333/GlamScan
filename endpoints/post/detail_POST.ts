import { db } from "../../helpers/db";
import { schema, OutputType, PostDetail } from "./detail_POST.schema";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import superjson from "superjson";

export async function handle(request: Request): Promise<Response> {
  try {
    const json = await request.json();
    const input = schema.parse(json);
    const { postId } = input;

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

    let query = db
      .selectFrom("posts")
      .innerJoin("users", "posts.userId", "users.id")
      .where("posts.id", "=", postId)
      .select([
        "posts.id",
        "posts.imageUrl",
        "posts.caption",
        "posts.productTags",
        "posts.createdAt",
        "users.id as authorId",
        "users.displayName as authorDisplayName",
        "users.avatarUrl as authorAvatarUrl",
        (eb) =>
          eb
            .selectFrom("votes")
            .select(eb.fn.count("id").as("count"))
            .whereRef("votes.postId", "=", "posts.id")
            .where("votes.voteType", "=", "upvote")
            .as("upvotes"),
        (eb) =>
          eb
            .selectFrom("votes")
            .select(eb.fn.count("id").as("count"))
            .whereRef("votes.postId", "=", "posts.id")
            .where("votes.voteType", "=", "downvote")
            .as("downvotes"),
      ]);

    if (user) {
      query = query.select((eb) =>
        eb
          .selectFrom("votes")
          .select("votes.voteType")
          .where("votes.userId", "=", user!.id)
          .whereRef("votes.postId", "=", "posts.id")
          .limit(1)
          .as("currentUserVote")
      );
    }

    const post = await query.executeTakeFirst();

    if (!post) {
      return new Response(
        superjson.stringify({ error: "Post not found" }),
        { status: 404 }
      );
    }

    const formattedPost: PostDetail = {
      ...post,
      upvotes: Number(post.upvotes) || 0,
      downvotes: Number(post.downvotes) || 0,
      currentUserVote: (post as any).currentUserVote ?? null,
    };

    return new Response(
      superjson.stringify(formattedPost satisfies OutputType)
    );
  } catch (error) {
    console.error("Error fetching post detail:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}