import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Messages } from "../../helpers/schema";

export const schema = z
  .object({
    conversationId: z.number().optional(),
    recipientId: z.number().optional(),
    content: z.string().min(1, "Message cannot be empty."),
    messageType: z.enum(["text", "image", "post_share"]).default("text"),
    metadata: z.record(z.any()).optional(),
  })
  .refine(
    (data) => data.conversationId || data.recipientId,
    "Either conversationId or recipientId must be provided."
  );

export type InputType = z.infer<typeof schema>;

export type Message = Selectable<Messages>;

export type OutputType = Message;

export const postSend = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const response = await fetch(`/_api/messages/send`, {
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