import { db } from "../../helpers/db";
import { schema, OutputType } from "./comments_POST.schema";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { generalRateLimiter } from "../../helpers/rateLimiter";
import { validateJsonInput, validateTextContent, addSecurityHeaders, createSafeErrorResponse, ValidationError } from "../../helpers/inputValidator";
import { sql } from "kysely";
import superjson from "superjson";

export async function handle(request: Request): Promise<Response> {
  try {
    // Rate limiting
    const rateLimitResult = await generalRateLimiter.checkLimit(request);
    if (!rateLimitResult.allowed) {
      return createSafeErrorResponse(
        new Error("Too many requests"),
        "Too many comment attempts. Please try again later.",
        429
      );
    }

    // Session validation
    const { user } = await getServerUserSession(request);

    // Validate and parse JSON input
    const validatedInput = await validateJsonInput(request, schema);
    const { postId, content, parentId } = validatedInput;

    // Sanitize comment content
    const sanitizedContent = validateTextContent(content, 1000);

    // Verify post exists before commenting
    const post = await db
      .selectFrom("posts")
      .select("id")
      .where("id", "=", postId)
      .executeTakeFirst();

    if (!post) {
      return createSafeErrorResponse(
        new ValidationError("Post not found"),
        "Post not found",
        404
      );
    }

    // If parentId is provided, verify the parent comment exists and belongs to the same post
    if (parentId) {
      const parentComment = await db
        .selectFrom("comments")
        .select(["id", "postId"])
        .where("id", "=", parentId)
        .executeTakeFirst();

      if (!parentComment) {
        return createSafeErrorResponse(
          new ValidationError("Parent comment not found"),
          "Parent comment not found",
          404
        );
      }

      if (parentComment.postId !== postId) {
        return createSafeErrorResponse(
          new ValidationError("Parent comment does not belong to this post"),
          "Parent comment does not belong to this post",
          400
        );
      }
    }

    // Use a transaction to ensure consistency when updating reply counts
    const result = await db.transaction().execute(async (trx) => {
      // Create the new comment
      const newComment = await trx
        .insertInto("comments")
        .values({
          postId,
          userId: user.id,
          content: sanitizedContent,
          parentId: parentId || null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // If this is a reply, increment the parent comment's reply count
      if (parentId) {
        await trx
          .updateTable("comments")
          .set({
            replyCount: sql<number>`coalesce(reply_count, 0) + 1`,
          })
          .where("id", "=", parentId)
          .execute();
      }

      return newComment;
    });

    const commentWithAuthor: OutputType = {
      id: result.id,
      content: result.content,
      createdAt: result.createdAt,
      parentId: result.parentId,
      replyCount: result.replyCount || 0,
      authorId: user.id,
      authorDisplayName: user.displayName,
      authorAvatarUrl: user.avatarUrl,
      replies: [],
      postId: result.postId,
    };

    const response = new Response(superjson.stringify(commentWithAuthor), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });

    return addSecurityHeaders(response);
  } catch (error) {
    return createSafeErrorResponse(error, "Failed to post comment", 400);
  }
}