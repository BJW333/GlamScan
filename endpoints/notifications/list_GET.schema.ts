import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Notifications, NotificationTypeArrayValues } from "../../helpers/schema";

export const schema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: z.enum(NotificationTypeArrayValues).optional(),
  isRead: z.preprocess((val) => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return undefined;
  }, z.boolean().optional()),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  notifications: Selectable<Notifications>[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
};

export const getNotificationsList = async (
  query: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });

  const result = await fetch(`/_api/notifications/list?${params.toString()}`, {
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