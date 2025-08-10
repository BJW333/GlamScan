import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Posts, Users } from "../../helpers/schema";

export const schema = z.object({
  limit: z.number().int().positive().optional().default(10),
  cursor: z.number().int().positive().optional(),
});

export type InputType = z.infer<typeof schema>;

export type PostFeedItem = Pick<
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

export type OutputType = {
  posts: PostFeedItem[];
  nextCursor: number | null;
};

export const getFeed = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  if (params.limit) {
    searchParams.set("limit", String(params.limit));
  }
  if (params.cursor) {
    searchParams.set("cursor", String(params.cursor));
  }

  const result = await fetch(`/_api/posts/feed?${searchParams.toString()}`, {
    method: "GET",
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