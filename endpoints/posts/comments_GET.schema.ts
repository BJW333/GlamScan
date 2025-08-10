import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Comments, Users } from "../../helpers/schema";

export const schema = z.object({
  postId: z.number().int().positive(),
});

export type InputType = z.infer<typeof schema>;

export type CommentWithAuthor = Pick<
  Selectable<Comments>,
  "id" | "content" | "createdAt" | "parentId" | "replyCount"
> & {
  authorId: Selectable<Users>["id"];
  authorDisplayName: Selectable<Users>["displayName"];
  authorAvatarUrl: Selectable<Users>["avatarUrl"];
  replies?: CommentWithAuthor[];
  postId?: number; // Optional for backward compatibility
};

export type OutputType = {
  comments: CommentWithAuthor[];
};

export const getComments = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams({
    postId: String(params.postId),
  });

  const result = await fetch(
    `/_api/posts/comments?${searchParams.toString()}`,
    {
      method: "GET",
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    }
  );

  if (!result.ok) {
    const errorObject = superjson.parse(await result.text()) as { error?: string };
    throw new Error(errorObject.error || 'An unknown error occurred');
  }
  return superjson.parse<OutputType>(await result.text());
};