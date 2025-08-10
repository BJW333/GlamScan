import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Messages } from "../../helpers/schema";

export const schema = z.object({
  conversationId: z.number(),
  cursor: z.string().datetime().optional(),
  limit: z.number().int().positive().optional().default(20),
});

export type InputType = z.infer<typeof schema>;

export type Message = Selectable<Messages>;

export type OutputType = {
  messages: Message[];
  nextCursor: string | null;
};

export const getConversation = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  searchParams.set("conversationId", params.conversationId.toString());
  if (params.cursor) {
    searchParams.set("cursor", params.cursor);
  }
  if (params.limit) {
    searchParams.set("limit", params.limit.toString());
  }

  const response = await fetch(
    `/_api/messages/conversation?${searchParams.toString()}`,
    {
      method: "GET",
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    }
  );

  if (!response.ok) {
    const errorObject = await response.json().catch(() => ({
      error: "An unexpected error occurred",
    }));
    throw new Error(errorObject.error);
  }

  return superjson.parse<OutputType>(await response.text());
};