import { z } from "zod";
import { addSecurityHeaders as addSecurityHeadersFromSecurity } from "./security";

/**
 * Comprehensive input validation and sanitization for authentication endpoints
 */

// Custom validation error class
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

// Re-export addSecurityHeaders from security helper
export const addSecurityHeaders = addSecurityHeadersFromSecurity;

// Email validation with normalization
export function validateAndNormalizeEmail(email: string): string {
  const emailSchema = z.string().email("Invalid email format").min(1).max(254);
  const validatedEmail = emailSchema.parse(email);
  return validatedEmail.toLowerCase().trim();
}

// Password validation
export function validatePassword(password: string): string {
  const passwordSchema = z.string()
    .min(1, "Password is required")
    .max(128, "Password too long"); // Prevent DoS attacks with extremely long passwords
  return passwordSchema.parse(password);
}

// Display name validation and sanitization
export function validateAndSanitizeDisplayName(displayName: string): string {
  const nameSchema = z.string()
    .min(1, "Display name is required")
    .max(100, "Display name too long")
    .regex(/^[a-zA-Z0-9\s\-_.]+$/, "Display name contains invalid characters");
  
  const validatedName = nameSchema.parse(displayName);
  return validatedName.trim();
}

// Generic string sanitization
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    throw new Error("Input must be a string");
  }
  
  // Remove null bytes and control characters except newlines and tabs
  const sanitized = input
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars
    .trim();
    
  if (sanitized.length > maxLength) {
    throw new Error(`Input exceeds maximum length of ${maxLength} characters`);
  }
  
  return sanitized;
}

// Validate JSON input size to prevent DoS
export function validateJsonSize(jsonString: string, maxSizeKB: number = 10): void {
  const sizeInKB = new Blob([jsonString]).size / 1024;
  if (sizeInKB > maxSizeKB) {
    throw new Error(`Request payload too large. Maximum size: ${maxSizeKB}KB`);
  }
}

// Safe JSON parsing with size validation
export async function safeParseJson(request: Request, maxSizeKB: number = 10): Promise<any> {
  const text = await request.text();
  validateJsonSize(text, maxSizeKB);
  
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error("Invalid JSON format");
  }
}

// Validate and parse JSON input with schema
export async function validateJsonInput<T>(request: Request, schema: z.ZodSchema<T>, maxSizeKB: number = 10): Promise<T> {
  const json = await safeParseJson(request, maxSizeKB);
  return schema.parse(json);
}

// Validate form data with size limits
export async function validateFormData(request: Request, maxSizeBytes: number = 10 * 1024 * 1024): Promise<FormData> {
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > maxSizeBytes) {
    throw new ValidationError(`Request payload too large. Maximum size: ${Math.round(maxSizeBytes / 1024 / 1024)}MB`);
  }
  
  try {
    return await request.formData();
  } catch (error) {
    throw new ValidationError("Invalid form data");
  }
}

// File upload validation
export function validateFileUpload(file: File, options: {
  maxSize: number;
  allowedTypes: string[];
  allowedExtensions: string[];
}): void {
  if (file.size > options.maxSize) {
    throw new ValidationError(`File size exceeds maximum of ${Math.round(options.maxSize / 1024 / 1024)}MB`);
  }
  
  if (!options.allowedTypes.includes(file.type)) {
    throw new ValidationError(`File type ${file.type} is not allowed`);
  }
  
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!options.allowedExtensions.includes(extension)) {
    throw new ValidationError(`File extension ${extension} is not allowed`);
  }
}

// Text content validation and sanitization
export function validateTextContent(content: string, maxLength: number = 1000): string {
  if (typeof content !== 'string') {
    throw new ValidationError("Content must be a string");
  }
  
  // Remove null bytes and control characters except newlines and tabs
  const sanitized = content
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars except \n and \t
    .trim();
    
  if (sanitized.length === 0) {
    throw new ValidationError("Content cannot be empty");
  }
    
  if (sanitized.length > maxLength) {
    throw new ValidationError(`Content exceeds maximum length of ${maxLength} characters`);
  }
  
  return sanitized;
}

// Create sanitized error responses
export function createSafeErrorResponse(
  error: unknown,
  fallbackMessage: string,
  status: number = 400
): Response {
  // Log the actual error for debugging (server-side only)
  console.error("Authentication error:", error);
  
  let message = fallbackMessage;
  
  // Only expose validation errors, not system errors
  if (error instanceof z.ZodError) {
    message = error.errors[0]?.message || fallbackMessage;
  } else if (error instanceof ValidationError) {
    message = error.message;
  } else if (error instanceof Error && error.message.includes("Invalid")) {
    message = error.message;
  } else if (error instanceof Error && (
    error.message.includes("required") ||
    error.message.includes("too long") ||
    error.message.includes("too large") ||
    error.message.includes("format")
  )) {
    message = error.message;
  }
  
  const response = new Response(
    JSON.stringify({ message }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  
  return addSecurityHeaders(response);
}

// Validate request origin (basic CSRF protection)
export function validateRequestOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  
  // For same-origin requests, either origin or referer should be present
  if (!origin && !referer) {
    throw new Error("Missing origin information");
  }
  
  // In production, you might want to validate against allowed origins
  // For now, we just ensure the headers are present for POST requests
}

// Rate limiting key generator for authentication endpoints
export function generateAuthRateLimitKey(request: Request, email?: string): string {
  // Use email if provided for more targeted rate limiting
  if (email) {
    return `auth:${email.toLowerCase()}`;
  }
  
  // Fall back to IP-based rate limiting
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0]?.trim() || realIp || 'unknown';
  return `auth:ip:${ip}`;
}