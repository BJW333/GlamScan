import { z } from "zod";
import superjson from "superjson";
import { REQUEST_TIMEOUT_MS, getAbortSignalWithTimeout } from "../../helpers/networkDefaults";

export const schema = z.object({
  id: z.number().int().positive(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
  message: string;
};

export const postStyleCombosDelete = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const signal = init?.signal || getAbortSignalWithTimeout(REQUEST_TIMEOUT_MS);
  
  const result = await fetch(`/_api/style-combos/delete`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    signal,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!result.ok) {
        const errorObject = superjson.parse(await result.text()) as { error?: string };
    throw new Error(errorObject.error || "Failed to delete style combo");
  }
  return superjson.parse<OutputType>(await result.text());
};