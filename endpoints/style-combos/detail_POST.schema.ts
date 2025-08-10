import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import type { StyleCombos, StyleComboItems } from "../../helpers/schema";
import { REQUEST_TIMEOUT_MS, getAbortSignalWithTimeout } from "../../helpers/networkDefaults";

export const schema = z.object({
  id: z.number().int().positive(),
});

export type InputType = z.infer<typeof schema>;

// Type for an item with price as a number
type StyleComboItemWithNumberPrice = Omit<Selectable<StyleComboItems>, "price"> & {
  price: number;
};

// Type for the combo with price as a number and items with price as a number
export type StyleComboWithItems = Omit<Selectable<StyleCombos>, "totalPrice"> & {
  totalPrice: number;
  items: StyleComboItemWithNumberPrice[];
};

export type OutputType = {
  styleCombo: StyleComboWithItems;
};

export const postStyleCombosDetail = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const signal = init?.signal || getAbortSignalWithTimeout(REQUEST_TIMEOUT_MS);
  
  const result = await fetch(`/_api/style-combos/detail`, {
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
    throw new Error(errorObject.error || "Failed to fetch style combo details");
  }
  return superjson.parse<OutputType>(await result.text());
};