import { z } from "zod";
import superjson from "superjson";
import { User } from "../../helpers/User";

export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

type Participant = Pick<User, "id" | "displayName" | "avatarUrl">;

export type ConversationSummary = {
  conversationId: number;
  participants: Participant[];
  lastMessage: {
    content: string;
    senderId: number;
    createdAt: Date;
  } | null;
  unreadCount: number;
};

export type OutputType = ConversationSummary[];

export const getConversations = async (
  body?: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const response = await fetch(`/_api/messages/conversations`, {
    method: "GET",
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