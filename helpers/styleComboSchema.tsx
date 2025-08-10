import { z } from "zod";

// Core enum schemas - single source of truth
export const SeasonSchema = z.enum(["spring", "summer", "fall", "winter"]);
export const OccasionSchema = z.enum(["casual", "formal", "business", "party", "date", "vacation"]);
export const StyleSchema = z.enum(["minimalist", "bohemian", "classic", "trendy", "edgy", "romantic"]);

// Nullable versions for optional filtering
export const NullableSeasonSchema = SeasonSchema.nullable();
export const NullableOccasionSchema = OccasionSchema.nullable();
export const NullableStyleSchema = StyleSchema.nullable();

// Validation utilities
const urlValidation = z.string().url("Must be a valid URL");

const priceValidation = z.number().positive("Price must be a positive number").max(999999, "Price cannot exceed $999,999");

// Sanitization utilities
export const sanitizeString = (str: string): string => {
  return str.trim().replace(/\s+/g, " ");
};

export const sanitizeUrl = (url: string): string => {
  try {
    const parsedUrl = new URL(url.trim());
    return parsedUrl.toString();
  } catch {
    return url.trim();
  }
};

// Enhanced validation schemas with sanitization
const sanitizedStringSchema = (message: string, minLength: number = 1) =>
  z.string()
    .min(1, message)
    .transform(sanitizeString)
    .refine(val => val.length >= minLength, { message });

const sanitizedUrlSchema = (message: string) =>
  z.string()
    .transform(sanitizeUrl)
    .pipe(urlValidation.refine(url => url.length > 0, { message }));

/**
 * Base schema for an individual item within a style combo.
 * This is used for both creating and updating style combos.
 * The `id` is optional as it won't exist for new items being added.
 */
export const StyleComboItemSchema = z.object({
  id: z.number().int().positive().optional(),
  name: sanitizedStringSchema("Item name is required", 1),
  price: priceValidation,
  imageUrl: sanitizedUrlSchema("A valid image URL is required"),
  affiliateUrl: sanitizedUrlSchema("A valid affiliate URL is required"),
  itemOrder: z.number().int().min(0).optional(),
});

/**
 * Base schema for a style combo, containing all fields common to both
 * create and update operations. This ensures type consistency.
 */
export const BaseStyleComboSchema = z.object({
  title: sanitizedStringSchema("Title is required", 1),
  description: z.string()
    .transform(sanitizeString)
    .nullable()
    .optional()
    .refine(val => val === null || val === undefined || val.length > 0, {
      message: "Description cannot be empty if provided"
    }),
  coverImageUrl: sanitizedUrlSchema("A valid cover image URL is required"),
  shopUrl: sanitizedUrlSchema("A valid shop URL is required"),
  totalPrice: priceValidation,
  season: NullableSeasonSchema.optional(),
  occasion: NullableOccasionSchema.optional(),
  style: NullableStyleSchema.optional(),
  isSponsored: z.boolean().default(false),
  items: z.array(StyleComboItemSchema)
    .min(1, "At least one item is required")
    .max(10, "Cannot have more than 10 items per style combo"),
});

/**
 * Schema for creating a new style combo.
 * It extends the base schema without adding any new fields.
 */
export const CreateStyleComboSchema = BaseStyleComboSchema;

/**
 * Schema for updating an existing style combo.
 * It extends the base schema and adds the required `id` field for the combo.
 */
export const UpdateStyleComboSchema = BaseStyleComboSchema.extend({
  id: z.number().int().positive("A valid style combo ID is required"),
});

// Filter schema for list endpoints
export const StyleComboListFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  season: z.string().min(1).optional(),
  occasion: z.string().min(1).optional(),
  style: z.string().min(1).optional(),
  search: z.string().min(1).optional(),
});

// Export Zod-inferred types for use in components and hooks
export type Season = z.infer<typeof SeasonSchema>;
export type Occasion = z.infer<typeof OccasionSchema>;
export type Style = z.infer<typeof StyleSchema>;

export type StyleComboItem = z.infer<typeof StyleComboItemSchema>;
export type CreateStyleComboInput = z.infer<typeof CreateStyleComboSchema>;
export type UpdateStyleComboInput = z.infer<typeof UpdateStyleComboSchema>;
export type StyleComboListFilters = z.infer<typeof StyleComboListFiltersSchema>;

// A unified type for a style combo that includes the ID, useful for frontend state management.
export type StyleCombo = z.infer<typeof UpdateStyleComboSchema>;

// Type utilities for better type safety
export type StyleComboFormData = Omit<CreateStyleComboInput, 'items'> & {
  items: Omit<StyleComboItem, 'id'>[];
};

export type PartialStyleCombo = Partial<StyleCombo>;

// Utility functions for type guards
export const isValidSeason = (value: string): value is Season => {
  return SeasonSchema.safeParse(value).success;
};

export const isValidOccasion = (value: string): value is Occasion => {
  return OccasionSchema.safeParse(value).success;
};

export const isValidStyle = (value: string): value is Style => {
  return StyleSchema.safeParse(value).success;
};

// Helper function to validate a full style combo
export const validateStyleCombo = (data: unknown): StyleCombo | null => {
  const result = UpdateStyleComboSchema.safeParse(data);
  return result.success ? result.data : null;
};

// Helper function to validate style combo items
export const validateStyleComboItem = (data: unknown): StyleComboItem | null => {
  const result = StyleComboItemSchema.safeParse(data);
  return result.success ? result.data : null;
};

// Constants for validation limits
export const VALIDATION_LIMITS = {
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_ITEM_NAME_LENGTH: 100,
  MIN_PRICE: 0.01,
  MAX_PRICE: 999999,
  MAX_ITEMS_PER_COMBO: 10,
  MIN_ITEMS_PER_COMBO: 1,
} as const;