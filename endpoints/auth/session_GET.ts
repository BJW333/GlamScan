import {
  setServerSession,
  NotAuthenticatedError,
  SessionExpirationSeconds,
} from "../../helpers/getSetServerSession";
import { User } from "../../helpers/User";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { authRateLimiter } from "../../helpers/rateLimiter";
import { addSecurityHeaders, createSafeErrorResponse } from "../../helpers/inputValidator";

export async function handle(request: Request) {
  try {
    // Rate limiting
    const rateLimitResult = await authRateLimiter.checkLimit(request);
    if (!rateLimitResult.allowed) {
      return createSafeErrorResponse(
        new Error("Too many requests"),
        "Too many session validation attempts. Please try again later.",
        429
      );
    }

    const { user, session } = await getServerUserSession(request);

    // Check if session is close to expiry and needs refresh
    const now = Date.now();
    const sessionAge = now - session.lastAccessed.getTime();
    const isNearExpiry = sessionAge > (SessionExpirationSeconds * 1000 * 0.8); // 80% of expiry time

    // Create response with user data
    const response = new Response(
      JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          role: user.role,
          gender: user.gender,
          stylePreferences: user.stylePreferences,
        } satisfies User,
        sessionInfo: {
          isNearExpiry,
          expiresAt: new Date(session.lastAccessed.getTime() + SessionExpirationSeconds * 1000),
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );

    // Update the session cookie with the new lastAccessed time
    await setServerSession(response, {
      id: session.id,
      createdAt: session.createdAt,
      lastAccessed: session.lastAccessed.getTime(),
    });

    return addSecurityHeaders(response);
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return createSafeErrorResponse(
        error,
        "Authentication required",
        401
      );
    }
    return createSafeErrorResponse(
      error,
      "Session validation failed",
      400
    );
  }
}
