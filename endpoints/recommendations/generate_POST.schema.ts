import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  selfieBase64: z.string().min(1, "A selfie image is required.")
    .refine((val) => {
      // Validate base64 format
      const base64Pattern = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
      return base64Pattern.test(val) || /^[A-Za-z0-9+/]+=*$/.test(val);
    }, "Invalid image format. Must be a valid base64 encoded image."),
});

export type InputType = z.infer<typeof schema>;

export const RecommendationSchema = z.object({
    type: z.union([z.literal("outfit"), z.literal("makeup")]),
    name: z.string().min(1, "Recommendation name is required"),
    description: z.string().min(1, "Recommendation description is required"),
    price: z.number().positive("Price must be positive"),
    imageUrl: z.string().url("Valid image URL is required"),
    affiliateUrl: z.string().url("Valid affiliate URL is required"),
});

export type Recommendation = z.infer<typeof RecommendationSchema>;

export const OutputSchema = z.object({
  recommendations: z.array(RecommendationSchema),
});

export type OutputType = z.infer<typeof OutputSchema>;

export const postGenerate = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/recommendations/generate`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!result.ok) {
    const errorText = await result.text();
    try {
      const errorObject = superjson.parse(errorText) as { error?: string };
      throw new Error(errorObject.error || "Failed to generate recommendations");
    } catch {
      throw new Error("Failed to generate recommendations");
    }
  }
  
  const responseText = await result.text();
  const parsedResponse = superjson.parse(responseText);
  return OutputSchema.parse(parsedResponse);
};