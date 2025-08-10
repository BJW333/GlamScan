// adapt this to the database schema and helpers if necessary
import { db } from "../../helpers/db";
import { schema } from "./register_with_password_POST.schema";
import { randomBytes } from "crypto";
import {
  setServerSession,
  SessionExpirationSeconds,
} from "../../helpers/getSetServerSession";
import { generatePasswordHash } from "../../helpers/generatePasswordHash";
import { authRateLimiter } from "../../helpers/rateLimiter";
import { 
  safeParseJson, 
  validateAndNormalizeEmail, 
  validatePassword,
  validateAndSanitizeDisplayName,
  createSafeErrorResponse,
  addSecurityHeaders,
  generateAuthRateLimitKey,
  validateRequestOrigin
} from "../../helpers/inputValidator";

export async function handle(request: Request) {
  try {
    // Validate request origin for CSRF protection
    validateRequestOrigin(request);
    
    // Safe JSON parsing with size validation
    const json = await safeParseJson(request, 10); // 10KB max for registration requests
    
    // Validate and sanitize inputs
    const rawEmail = json.email;
    const rawPassword = json.password;
    const rawDisplayName = json.displayName;
    const rawGender = json.gender;
    
    if (!rawEmail || !rawPassword || !rawDisplayName) {
      return createSafeErrorResponse(
        new Error("Email, password, and display name are required"),
        "Email, password, and display name are required",
        400
      );
    }
    
    const normalizedEmail = validateAndNormalizeEmail(rawEmail);
    const validatedPassword = validatePassword(rawPassword);
    const sanitizedDisplayName = validateAndSanitizeDisplayName(rawDisplayName);
    
    // Rate limiting with email-based key
    const rateLimitResult = await authRateLimiter.checkLimit(
      request, 
      generateAuthRateLimitKey(request, normalizedEmail)
    );
    
    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil(
        (rateLimitResult.resetTime.getTime() - Date.now()) / 1000
      );
      const response = new Response(
        JSON.stringify({
          message: "Too many registration attempts. Please try again later.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfter),
          },
        }
      );
      return addSecurityHeaders(response);
    }
    
    // Additional schema validation
    const { email, password, displayName, gender } = schema.parse({ 
      email: normalizedEmail, 
      password: validatedPassword,
      displayName: sanitizedDisplayName,
      gender: rawGender
    });

    // Check if email already exists
    const existingUser = await db
      .selectFrom("users")
      .select("id")
      .where("email", "=", email)
      .limit(1)
      .execute();

    if (existingUser.length > 0) {
      const response = new Response(
        JSON.stringify({ message: "Email already in use" }),
        { 
          status: 409,
          headers: { "Content-Type": "application/json" }
        }
      );
      return addSecurityHeaders(response);
    }

    const passwordHash = await generatePasswordHash(password);

    // Create new user
    const newUser = await db.transaction().execute(async (trx) => {
      // Insert the user
      const [user] = await trx
        .insertInto("users")
        .values({
          email,
          displayName,
          gender: gender || null,
          role: "user", // Default role
        })
        .returning(["id", "email", "displayName", "gender", "stylePreferences", "createdAt"])
        .execute();

      // Store the password hash in another table
      await trx
        .insertInto("userPasswords")
        .values({
          userId: user.id,
          passwordHash,
        })
        .execute();

      return user;
    });

    // Create a new session
    const sessionId = randomBytes(32).toString("hex");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SessionExpirationSeconds * 1000);

    await db
      .insertInto("sessions")
      .values({
        id: sessionId,
        userId: newUser.id,
        createdAt: now,
        lastAccessed: now,
        expiresAt,
      })
      .execute();

    // Create response with user data
    const response = new Response(
      JSON.stringify({
        user: {
          ...newUser,
          role: "user" as const,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );

    // Set session cookie
    await setServerSession(response, {
      id: sessionId,
      createdAt: now.getTime(),
      lastAccessed: now.getTime(),
    });

    return addSecurityHeaders(response);
  } catch (error: unknown) {
    // Check if it's already a Response (from rate limiting)
    if (error instanceof Response) {
      return error;
    }
    
    return createSafeErrorResponse(
      error,
      "Registration failed",
      400
    );
  }
}
