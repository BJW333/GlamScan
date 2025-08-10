import { z } from "zod";
import superjson from "superjson";
import { UpdateStyleComboSchema } from "../../helpers/styleComboSchema";
import { REQUEST_TIMEOUT_MS, getAbortSignalWithTimeout } from "../../helpers/networkDefaults";

export const schema = UpdateStyleComboSchema;

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
  styleComboId: number;
};

export const postStyleCombosUpdate = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const signal = init?.signal || getAbortSignalWithTimeout(REQUEST_TIMEOUT_MS);
  
  const result = await fetch(`/_api/style-combos/update`, {
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
    throw new Error(errorObject.error || "Failed to update style combo");
  }
  return superjson.parse<OutputType>(await result.text());
};