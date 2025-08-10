import { z } from "zod";
import { Selectable } from "kysely";
import type { StyleCombos, StyleComboItems } from "../../helpers/schema";
import { StyleComboListFiltersSchema } from "../../helpers/styleComboSchema";
import { REQUEST_TIMEOUT_MS, getAbortSignalWithTimeout } from "../../helpers/networkDefaults";

export const StyleComboListFilters = StyleComboListFiltersSchema;

export type InputType = z.infer<typeof StyleComboListFilters>;

// Define proper types for style combo items (excluding sensitive data)
export type PublicStyleComboItem = Omit<Selectable<StyleComboItems>, 'id'> & {
  itemOrder: number;
};

export type PublicStyleComboWithItems = Omit<Selectable<StyleCombos>, 'isSponsored'> & {
  items: PublicStyleComboItem[];
};

export type OutputType = {
  styleCombos: PublicStyleComboWithItems[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export const getStyleCombosList = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, String(value));
    }
  });

  const signal = init?.signal || getAbortSignalWithTimeout(REQUEST_TIMEOUT_MS);

  const result = await fetch(`/_api/style-combos/list?${queryParams.toString()}`, {
    method: "GET",
    ...init,
    signal,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = JSON.parse(await result.text()) as { error?: string };
    throw new Error(errorObject.error || "Failed to fetch style combos");
  }
  return JSON.parse(await result.text()) as OutputType;
};