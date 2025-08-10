import { z } from "zod";
import superjson from "superjson";
import { GenderOptionArrayValues } from "../../helpers/schema";

export const schema = z.object({
  occasion: z.string().min(3, "Occasion must be at least 3 characters").optional(),
  style: z.string().min(3, "Style must be at least 3 characters").optional(),
  budget: z.number().positive("Budget must be a positive number").optional(),
  otherPreferences: z.string().max(500, "Preferences must be 500 characters or less").optional(),
});

export type InputType = z.infer<typeof schema>;

export const AiOutfitItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  description: z.string().min(1, "Item description is required"),
  category: z.string().min(1, "Item category is required"),
  price: z.number().positive("Price must be a positive number"),
  imageUrl: z.string().url("A valid image URL is required"),
  affiliateUrl: z.string().url("A valid affiliate URL is required"),
});

export const OutputSchema = z.object({
  outfit: z.array(AiOutfitItemSchema),
});

export type OutputType = z.infer<typeof OutputSchema>;

export const postGenerateAiOutfit = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/ai-outfit/generate`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const responseText = await result.text();
  const parsedJson = superjson.parse(responseText);

  if (!result.ok) {
    const error = parsedJson as { error?: string };
    throw new Error(error.error || "Failed to generate AI outfit.");
  }

  return OutputSchema.parse(parsedJson);
};