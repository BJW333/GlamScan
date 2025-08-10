

/**
 * Default timeout for network requests in milliseconds.
 */
export const REQUEST_TIMEOUT_MS = 10000; // 10 seconds

/**
 * Default retry count for React Query queries.
 */
export const QUERY_RETRY_COUNT = 2;

/**
 * Default retry count for React Query mutations.
 */
export const MUTATION_RETRY_COUNT = 1;

/**
 * A standardized error handler for network requests.
 * Logs the error to the console with a provided context.
 * @param error The error object, which is of type `unknown`.
 * @param context A string describing the context where the error occurred (e.g., "Style combos list").
 */
export const handleNetworkError = (error: unknown, context: string): void => {
  if (error instanceof Error) {
    // Don't log abort errors as they are expected user/system actions
    if (error.name === 'AbortError') {
      console.log(`[${context}] Request was aborted.`);
      return;
    }
    console.error(`[${context}] Network Error:`, error.message, error.stack);
  } else {
    console.error(`[${context}] An unknown network error occurred:`, error);
  }
};

/**
 * Creates an AbortSignal that aborts after a specified timeout.
 * This provides a cross-browser compatible way to handle request timeouts,
 * using AbortController and setTimeout.
 * @param timeoutMs The timeout in milliseconds. Defaults to REQUEST_TIMEOUT_MS.
 * @returns An AbortSignal.
 */
export const getAbortSignalWithTimeout = (timeoutMs: number = REQUEST_TIMEOUT_MS): AbortSignal => {
  const controller = new AbortController();
  setTimeout(() => {
    // Create a DOMException for timeout, which is what native AbortSignal.timeout does
    const timeoutError = new DOMException(`Request timed out after ${timeoutMs}ms`, 'TimeoutError');
    controller.abort(timeoutError);
  }, timeoutMs);
  return controller.signal;
};