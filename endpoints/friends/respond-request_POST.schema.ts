import { z } from "zod";
import superjson from "superjson";

export const FriendRequestActionSchema = z.union([
  z.literal("accept"),
  z.literal("decline"),
  z.literal("block"),
]);
export type FriendRequestAction = z.infer<typeof FriendRequestActionSchema>;

export const schema = z.object({
  requesterId: z.number().int().positive(),
  action: FriendRequestActionSchema,
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: true;
  action: FriendRequestAction;
};

export const postRespondRequest = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/friends/respond-request`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
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