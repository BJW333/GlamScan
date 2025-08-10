import { db } from "../../helpers/db";
import { schema, OutputType, CommentWithAuthor } from "./comments_GET.schema";
import superjson from "superjson";

export async function handle(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const input = schema.parse({
      postId: url.searchParams.get("postId")
        ? parseInt(url.searchParams.get("postId") as string, 10)
        : undefined,
    });

    // Fetch all comments for the post
    const allComments = await db
      .selectFrom("comments")
      .innerJoin("users", "comments.userId", "users.id")
      .where("comments.postId", "=", input.postId)
      .select([
        "comments.id",
        "comments.content",
        "comments.createdAt",
        "comments.parentId",
        "comments.replyCount",
        "users.id as authorId",
        "users.displayName as authorDisplayName",
        "users.avatarUrl as authorAvatarUrl",
      ])
      .orderBy("comments.createdAt", "asc")
      .execute();

    // Transform flat list into hierarchical structure
    const commentMap = new Map<number, CommentWithAuthor>();
    const topLevelComments: CommentWithAuthor[] = [];

    // First pass: create all comment objects
    allComments.forEach(comment => {
      const commentWithAuthor: CommentWithAuthor = {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        parentId: comment.parentId,
        replyCount: comment.replyCount || 0,
        authorId: comment.authorId,
        authorDisplayName: comment.authorDisplayName,
        authorAvatarUrl: comment.authorAvatarUrl,
        replies: [],
      };
      commentMap.set(comment.id, commentWithAuthor);
    });

    // Second pass: organize into hierarchy
    allComments.forEach(comment => {
      const commentWithAuthor = commentMap.get(comment.id)!;
      
      if (comment.parentId === null) {
        // Top-level comment
        topLevelComments.push(commentWithAuthor);
      } else {
        // Reply comment - add to parent's replies
        const parentComment = commentMap.get(comment.parentId);
        if (parentComment) {
          parentComment.replies!.push(commentWithAuthor);
        }
      }
    });

    return new Response(superjson.stringify({ comments: topLevelComments } satisfies OutputType));
  } catch (error) {
    console.error("Error fetching comments:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}