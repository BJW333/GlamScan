import { randomBytes } from "crypto";
import { User } from "./User";
import { RateLimiter } from "./rateLimiter";
import { NotAuthenticatedError } from "./getSetServerSession";

// --- CSRF Protection ---

const CSRF_COOKIE_NAME = "floot_csrf_token";
const CSRF_HEADER_NAME = "X-CSRF-Token";

/**
 * Generates a secure, random CSRF token.
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Sets the CSRF token cookie on a Response object.
 * This cookie is NOT HttpOnly, so it can be read by client-side JavaScript.
 * @param response The Response object to modify.
 * @param token The CSRF token to set.
 */
export function setCsrfCookie(response: Response, token: string): void {
  const cookieValue = [
    `${CSRF_COOKIE_NAME}=${token}`,
    "Secure",
    "SameSite=Strict",
    "Partitioned",
    "Path=/",
  ].join("; ");
  response.headers.append("Set-Cookie", cookieValue);
}

/**
 * Verifies the CSRF token for a given request.
 * Compares the token from the X-CSRF-Token header with the token from the cookie.
 * Throws an error if validation fails.
 * This should be used for all state-changing requests (POST, PUT, DELETE, etc.).
 * @param request The incoming Request object.
 */
export function verifyCsrfToken(request: Request): void {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => c.trim().split("=").map(decodeURIComponent))
  );
  const cookieToken = cookies[CSRF_COOKIE_NAME];
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    console.error("CSRF token validation failed.");
    throw new Error("Invalid CSRF token. Request rejected.");
  }
}

// --- Security Headers ---

/**
 * Adds essential security headers to a Response object to enhance application security.
 * @param response The Response object to add headers to.
 * @returns The modified Response object.
 */
export function addSecurityHeaders(response: Response): Response {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  // A restrictive Content-Security-Policy. Adjust as needed for your application's resources.
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self';"
  );
  // A restrictive Permissions-Policy.
  response.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()"
  );
  return response;
}

// --- Error Sanitization ---

/**
 * Creates a safe, sanitized JSON Response from an error, preventing information leakage.
 * Logs the original error for debugging purposes.
 * @param error The error object (unknown type).
 * @param publicMessage A generic, safe message to display to the user.
 * @param status The HTTP status code for the response.
 * @returns A Response object.
 */
export function createSafeErrorResponse(
  error: unknown,
  publicMessage: string,
  status: number
): Response {
  console.error("An error occurred:", error);

  if (error instanceof NotAuthenticatedError) {
    return new Response(JSON.stringify({ message: "Authentication required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ message: publicMessage }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// --- Rate Limiting Middleware ---

/**
 * A middleware-style function to apply rate limiting to an endpoint.
 * Throws a Response object if the rate limit is exceeded, which should be caught and returned by the handler.
 * @param request The incoming Request object.
 * @param limiter The RateLimiter instance to use.
 * @param identifier An optional unique identifier for the rate limit key (e.g., user ID, email).
 */
export async function applyRateLimiting(
  request: Request,
  limiter: RateLimiter,
  identifier?: string
): Promise<void> {
  const result = await limiter.checkLimit(request, identifier);
  if (!result.allowed) {
    const retryAfter = Math.ceil(
      (result.resetTime.getTime() - Date.now()) / 1000
    );
    const response = new Response(
      JSON.stringify({
        message: "Too many requests. Please try again later.",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
        },
      }
    );
    // Throwing a response is a pattern to allow early exit from handlers
    throw response;
  }
}

// --- Role-Based Authorization ---

/**
 * Checks if a user has one of the required roles.
 * Throws an error if the user is null or does not have the required role.
 * @param user The user object, or null if not authenticated.
 * @param requiredRoles An array of roles that are allowed to access the resource.
 */
export function authorize(
  user: User | null,
  requiredRoles: User["role"][]
): void {
  if (!user) {
    throw new NotAuthenticatedError("User is not authenticated.");
  }
  if (!requiredRoles.includes(user.role)) {
    console.warn(
      `Authorization failed for user ${user.id}. Required roles: ${requiredRoles.join(
        ", "
      )}, user role: ${user.role}`
    );
    throw new Error("Forbidden: You do not have permission to perform this action.");
  }
}

// --- Input Sanitization (Placeholder) ---

/**
 * A placeholder for a generic input sanitization utility.
 * In a real application, this would use a library like DOMPurify for HTML or implement specific logic.
 * For now, it performs basic trimming.
 * @param input The string to sanitize.
 * @returns The sanitized string.
 */
export function sanitizeInput(input: string): string {
  // Basic sanitization: trim whitespace.
  // For content that could be rendered as HTML, use a library like DOMPurify.
  return input.trim();
}