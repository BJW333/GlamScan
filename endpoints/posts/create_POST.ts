import { db } from "../../helpers/db";
import { schema, OutputType } from "./create_POST.schema";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { postRateLimiter } from "../../helpers/rateLimiter";
import { validateFormData, validateFileUpload, validateTextContent, addSecurityHeaders, createSafeErrorResponse, ValidationError } from "../../helpers/inputValidator";
import superjson from "superjson";

// In a real app, you'd upload the file to a service like S3, R2, etc.
// and get a URL back. For this example, we'll simulate this by returning a placeholder URL.
// This function would be in a separate helper, e.g., `helpers/fileStorage.ts`.
async function uploadImageToStorage(file: File): Promise<string> {
  console.log(`Simulating upload for file: ${file.name}, size: ${file.size}`);
  // In a real implementation, you would use an SDK to upload to a cloud storage provider.
  // For example, using AWS S3:
  // const s3Client = new S3Client(...);
  // const uploadParams = { Bucket: 'your-bucket', Key: `posts/${Date.now()}-${file.name}`, Body: file.stream() };
  // await s3Client.send(new PutObjectCommand(uploadParams));
  // return `https://your-bucket.s3.amazonaws.com/posts/${Date.now()}-${file.name}`;

  // Placeholder for demonstration purposes.
  return `https://cdn.glamscan.app/images/posts/${Date.now()}-${file.name}`;
}

export async function handle(request: Request): Promise<Response> {
  try {
    // Rate limiting
    const rateLimitResult = await postRateLimiter.checkLimit(request);
    if (!rateLimitResult.allowed) {
      return createSafeErrorResponse(
        new Error("Too many requests"),
        "Too many post creation attempts. Please try again later.",
        429
      );
    }

    // Session validation
    const { user } = await getServerUserSession(request);
    
    // Verify user exists and has proper permissions
    if (!user || !user.id) {
      return createSafeErrorResponse(
        new ValidationError("Authentication required"),
        "Authentication required",
        401
      );
    }

    // Validate form data with size limits
    const formData = await validateFormData(request, 10 * 1024 * 1024); // 10MB limit

    const rawData: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      rawData[key] = value;
    }

    // Validate input schema
    const { caption, productTags, image } = schema.parse(rawData);

    if (!(image instanceof File)) {
      throw new ValidationError("Image upload is not a file.");
    }

    // Comprehensive file validation
    validateFileUpload(image, {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
      allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"]
    });

    // Sanitize caption if provided
    const sanitizedCaption = caption ? validateTextContent(caption, 2200) : null;

    // Product tags are already validated by the schema transformation
    const validatedProductTags = productTags || null;

    const imageUrl = await uploadImageToStorage(image);

    const newPost = await db
      .insertInto("posts")
      .values({
        userId: user.id,
        imageUrl,
        caption: sanitizedCaption,
        productTags: validatedProductTags ? JSON.stringify(validatedProductTags) : null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    const response = new Response(superjson.stringify(newPost satisfies OutputType), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });

    return addSecurityHeaders(response);
  } catch (error) {
    return createSafeErrorResponse(error, "Failed to create post", 400);
  }
}