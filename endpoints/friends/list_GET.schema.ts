import { z } from "zod";
import superjson from "superjson";
import { FriendStatus } from "../../helpers/schema";

export const FriendListFilterSchema = z.union([
  z.literal("all"),
  z.literal("pending_sent"),
  z.literal("pending_received"),
  z.literal("blocked"),
]);
export type FriendListFilter = z.infer<typeof FriendListFilterSchema>;

export const schema = z.object({
  filter: FriendListFilterSchema.default("all"),
});

export type InputType = z.infer<typeof schema>;

export type FriendListItem = {
  id: number;
  displayName: string;
  avatarUrl: string | null;
  requesterId?: number; // Only for pending_received
};

export type OutputType = FriendListItem[];

export const getFriendsList = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedParams = schema.parse(params);
  const searchParams = new URLSearchParams({
    filter: validatedParams.filter,
  });

  const result = await fetch(`/_api/friends/list?${searchParams.toString()}`, {
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