import { schema, OutputType } from "./profile_POST.schema";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { db } from "../../helpers/db";
import { generalRateLimiter } from "../../helpers/rateLimiter";
import { validateJsonInput, validateTextContent, addSecurityHeaders, createSafeErrorResponse, ValidationError } from "../../helpers/inputValidator";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Users } from "../../helpers/schema";

export async function handle(request: Request) {
  try {
    // Rate limiting
    const rateLimitResult = await generalRateLimiter.checkLimit(request);
    if (!rateLimitResult.allowed) {
      return createSafeErrorResponse(
        new Error("Too many requests"),
        "Too many profile update attempts. Please try again later.",
        429
      );
    }

    // Session validation
    const { user } = await getServerUserSession(request);

    // Validate and parse JSON input
    const input = await validateJsonInput(request, schema);

    // Filter out undefined values so we only update fields that were provided.
    const updateData: Partial<Pick<Selectable<Users>, 'displayName' | 'avatarUrl'>> = {};
    
    if (input.displayName !== undefined) {
        // Sanitize display name
        updateData.displayName = validateTextContent(input.displayName, 100);
    }
    
    if (input.avatarUrl !== undefined) {
        if (input.avatarUrl !== null) {
          // Validate URL format and ensure it's reasonable length
          if (input.avatarUrl.length > 500) {
            throw new ValidationError("Avatar URL is too long");
          }
          // Basic URL validation is already done by schema, but add additional security checks
          const url = new URL(input.avatarUrl); // This will throw if invalid
          if (!['http:', 'https:'].includes(url.protocol)) {
            throw new ValidationError("Avatar URL must use HTTP or HTTPS protocol");
          }
        }
        updateData.avatarUrl = input.avatarUrl;
    }

    if (Object.keys(updateData).length === 0) {
        return createSafeErrorResponse(
          new ValidationError("No fields to update were provided."),
          "No fields to update were provided.",
          400
        );
    }

    const [updatedUser] = await db
      .updateTable("users")
      .set({ ...updateData, updatedAt: new Date() })
      .where("id", "=", user.id)
      .returning(["id", "email", "displayName", "avatarUrl", "role", "gender", "stylePreferences"])
      .execute();

    if (!updatedUser) {
      throw new Error("Failed to update user profile in database.");
    }

    const response: OutputType = {
        user: {
            id: updatedUser.id,
            email: updatedUser.email,
            displayName: updatedUser.displayName,
            avatarUrl: updatedUser.avatarUrl,
            role: updatedUser.role,
            gender: updatedUser.gender,
            stylePreferences: updatedUser.stylePreferences,
        }
    };

    const responseObj = new Response(superjson.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });

    return addSecurityHeaders(responseObj);
  } catch (error) {
    return createSafeErrorResponse(error, "Failed to update profile", 400);
  }
}