import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  conversationId: z.number(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
  markedAsReadCount: number;
};

export const postMarkRead = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const response = await fetch(`/_api/messages/mark-read`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const errorObject = await response.json().catch(() => ({
      error: "An unexpected error occurred",
    }));
    throw new Error(errorObject.error);
  }

  return superjson.parse<OutputType>(await response.text());
};