import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Posts, Users } from "../../helpers/schema";

export const schema = z.object({
  postId: z.number().int().positive(),
});

export type InputType = z.infer<typeof schema>;

export type PostDetail = Pick<
  Selectable<Posts>,
  "id" | "imageUrl" | "caption" | "productTags" | "createdAt"
> & {
  authorId: Selectable<Users>["id"];
  authorDisplayName: Selectable<Users>["displayName"];
  authorAvatarUrl: Selectable<Users>["avatarUrl"];
  upvotes: number;
  downvotes: number;
  currentUserVote: "upvote" | "downvote" | null;
};

export type OutputType = PostDetail | { error: string };

export const postDetail = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/post/detail`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const responseJson = superjson.parse(await result.text());

  if (!result.ok) {
    throw new Error((responseJson as { error: string }).error || "An unknown error occurred");
  }
  
  return responseJson as OutputType;
};