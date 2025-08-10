import { db } from "../../helpers/db";
import { schema, OutputType } from "./vote_POST.schema";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import superjson from "superjson";
import { sql } from "kysely";

export async function handle(request: Request): Promise<Response> {
  try {
    const { user } = await getServerUserSession(request);
    const json = superjson.parse(await request.text());
    const { postId, voteType } = schema.parse(json);

    await db.transaction().execute(async (trx) => {
      const existingVote = await trx
        .selectFrom("votes")
        .select("voteType")
        .where("postId", "=", postId)
        .where("userId", "=", user.id)
        .executeTakeFirst();

      if (existingVote) {
        if (existingVote.voteType === voteType) {
          // User is toggling off their vote
          await trx
            .deleteFrom("votes")
            .where("postId", "=", postId)
            .where("userId", "=", user.id)
            .execute();
        } else {
          // User is changing their vote
          await trx
            .updateTable("votes")
            .set({ voteType })
            .where("postId", "=", postId)
            .where("userId", "=", user.id)
            .execute();
        }
      } else {
        // New vote
        await trx
          .insertInto("votes")
          .values({
            postId,
            userId: user.id,
            voteType,
          })
          .execute();
      }
    });

    // Fetch the updated counts
    const counts = await db
      .selectFrom("posts")
      .select([
        (eb) =>
          eb
            .selectFrom("votes")
            .select(eb.fn.count("id").as("count"))
            .whereRef("votes.postId", "=", "posts.id")
            .where("voteType", "=", "upvote")
            .as("upvotes"),
        (eb) =>
          eb
            .selectFrom("votes")
            .select(eb.fn.count("id").as("count"))
            .whereRef("votes.postId", "=", "posts.id")
            .where("voteType", "=", "downvote")
            .as("downvotes"),
      ])
      .where("id", "=", postId)
      .executeTakeFirst();

    if (!counts) {
      return new Response(superjson.stringify({ error: "Post not found" }), {
        status: 404,
      });
    }

    const output: OutputType = {
      postId,
      upvotes: Number(counts.upvotes) || 0,
      downvotes: Number(counts.downvotes) || 0,
    };

    return new Response(superjson.stringify(output));
  } catch (error) {
    console.error("Error voting on post:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}