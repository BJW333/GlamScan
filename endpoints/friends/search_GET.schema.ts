import { z } from "zod";
import superjson from "superjson";
import { FriendStatus } from "../../helpers/schema";

export const schema = z.object({
  query: z.string().min(2, "Search query must be at least 2 characters long."),
});

export type InputType = z.infer<typeof schema>;

export type UserSearchResult = {
  id: number;
  displayName: string;
  avatarUrl: string | null;
  friendStatus: FriendStatus | null; // null if no relationship exists
  isRequestSentByMe: boolean;
};

export type OutputType = UserSearchResult[];

export const getSearch = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedParams = schema.parse(params);
  const searchParams = new URLSearchParams({
    query: validatedParams.query,
  });

  const result = await fetch(`/_api/friends/search?${searchParams.toString()}`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse(await result.text()) as { error: string };
    throw new Error(errorObject.error);
  }
  return superjson.parse<OutputType>(await result.text());
};