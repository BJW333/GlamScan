import { z } from "zod";
import superjson from 'superjson';
import { REQUEST_TIMEOUT_MS, getAbortSignalWithTimeout } from "../../helpers/networkDefaults";

export const schema = z.object({
  description: z.string().min(10, { message: "Description must be at least 10 characters long." }).max(500),
  title: z.string().optional(),
  season: z.string().optional(),
  style: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;

export const GeneratedItemSchema = z.object({
    name: z.string(),
    price: z.number(),
    imageUrl: z.string().url(),
    affiliateUrl: z.string().url(),
});

export type GeneratedItem = z.infer<typeof GeneratedItemSchema>;

// Note: do not define zod schema for output type - just define the type directly
// The output is an array of generated items.
export type OutputType = GeneratedItem[];

export const postGenerateLinks = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const signal = init?.signal || getAbortSignalWithTimeout(REQUEST_TIMEOUT_MS);
  
  const result = await fetch(`/_api/style-combos/generate-links`, {
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
    try {
                const errorObject = superjson.parse(await result.text()) as { error?: string };
        throw new Error(errorObject.error || 'An unknown error occurred');
    } catch (e) {
        // If parsing fails, throw a generic error
        throw new Error(`Request failed with status ${result.status}`);
    }
  }
  
  return superjson.parse<OutputType>(await result.text());
};