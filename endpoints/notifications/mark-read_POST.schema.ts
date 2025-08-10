import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  notificationIds: z.array(z.number().int().positive()),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
  updatedCount: number;
};

export const postMarkNotificationsRead = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/notifications/mark-read`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
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