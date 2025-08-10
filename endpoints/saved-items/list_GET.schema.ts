import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import type { Posts } from "../../helpers/schema";
import type { StyleComboWithItems } from "../style-combos/list_GET.schema";

export const SavedItemListFilters = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type InputType = z.infer<typeof SavedItemListFilters>;

export const SavedPost = z.object({
  itemType: z.literal("post"),
  id: z.number(),
  userId: z.number(),
  imageUrl: z.string(),
  caption: z.string().nullable(),
  productTags: z.any().nullable(), // Assuming JSON for now
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
});

export const SavedStyleCombo = z.object({
  itemType: z.literal("style_combo"),
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  coverImageUrl: z.string(),
  shopUrl: z.string(),
  totalPrice: z.string(), // Numeric is string in kysely
  season: z.string().nullable(),
  occasion: z.string().nullable(),
  style: z.string().nullable(),
  isSponsored: z.boolean().nullable(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
  items: z.array(z.object({
    id: z.number(),
    comboId: z.number(),
    name: z.string(),
    imageUrl: z.string(),
    affiliateUrl: z.string(),
    price: z.string(), // Numeric
    itemOrder: z.number().nullable(),
    createdAt: z.date(),
  }))
});

export const SavedItem = z.discriminatedUnion("itemType", [
  SavedPost,
  SavedStyleCombo,
]);

export type SavedItemType = z.infer<typeof SavedItem>;

export type OutputType = {
  savedItems: SavedItemType[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export const getSavedItemsList = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, String(value));
    }
  });

  const result = await fetch(`/_api/saved-items/list?${queryParams.toString()}`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse(await result.text()) as { error?: string };
    throw new Error(errorObject.error || "Failed to fetch saved items");
  }
  return superjson.parse<OutputType>(await result.text());
};