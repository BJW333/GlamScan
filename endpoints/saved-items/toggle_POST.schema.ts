import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  itemId: z.number().int().positive(),
  itemType: z.enum(["post", "style_combo"]),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  saved: boolean;
};

export const postToggleSavedItem = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/saved-items/toggle`, {
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
    throw new Error(errorObject.error || "Failed to toggle saved item");
  }
  return superjson.parse<OutputType>(await result.text());
};