import { z } from "zod";
import superjson from "superjson";
import { CommentWithAuthor } from "./comments_GET.schema";

export const schema = z.object({
  postId: z.number().int().positive(),
  content: z.string().min(1).max(1000),
  parentId: z.number().int().positive().optional(),
});

export type InputType = z.infer<typeof schema>;

// The output is a single comment with author info, same as the items in the GET endpoint but with postId included
export type OutputType = CommentWithAuthor & { postId: number };

export const postComment = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/posts/comments`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse(await result.text()) as { error?: string };
    throw new Error(errorObject.error || 'An unknown error occurred');
  }
  return superjson.parse<OutputType>(await result.text());
};