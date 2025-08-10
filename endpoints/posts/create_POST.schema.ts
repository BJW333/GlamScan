import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Posts } from "../../helpers/schema";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

// Define proper ProductTag type
export const ProductTagSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  price: z.number().positive().optional(),
  url: z.string().url().optional(),
  x: z.number().min(0).max(100), // Percentage position
  y: z.number().min(0).max(100), // Percentage position
});

export type ProductTag = z.infer<typeof ProductTagSchema>;

export const schema = z.object({
  caption: z.string().max(2200).optional(),
  // Use proper validation for productTags instead of any
  productTags: z.unknown().optional().transform((val) => {
    if (val === undefined || val === null) return undefined;
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        return z.array(ProductTagSchema).parse(parsed);
      } catch {
        throw new Error("Invalid product tags JSON format");
      }
    }
    return z.array(ProductTagSchema).parse(val);
  }),
  image: z
    .unknown()
    .refine((file): file is File => file instanceof File, "Image is required.")
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      `Max image size is 5MB.`
    )
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type as typeof ACCEPTED_IMAGE_TYPES[number]),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    ),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = Selectable<Posts>;

export const postCreate = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  // When sending a file, we must use FormData
  const formData = new FormData();
  if (body.caption) {
    formData.append("caption", body.caption);
  }
  if (body.productTags) {
    // It's common to stringify JSON when sending it in FormData
    formData.append("productTags", JSON.stringify(body.productTags));
  }
  formData.append("image", body.image);

  const result = await fetch(`/_api/posts/create`, {
    method: "POST",
    body: formData,
    ...init,
    // Do not set Content-Type header when using FormData, the browser does it automatically with the correct boundary.
  });

  if (!result.ok) {
    const errorObject = superjson.parse(await result.text()) as { error?: string };
    throw new Error(errorObject.error || 'An unknown error occurred');
  }
  return superjson.parse<OutputType>(await result.text());
};