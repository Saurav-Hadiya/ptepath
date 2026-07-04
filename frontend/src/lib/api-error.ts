import { isAxiosError } from 'axios';

const FALLBACK = 'Something went wrong. Please try again.';

/**
 * Normalizes any thrown value into a plain Error with a user-readable message.
 * Always prefers the server-provided message from the API response body.
 * Falls back to the generic message only when the server provides none.
 */
export function normalizeError(error: unknown): Error {
  if (isAxiosError(error)) {
    const serverMessage: unknown = error.response?.data?.message;
    if (typeof serverMessage === 'string' && serverMessage.trim()) {
      return new Error(serverMessage.trim());
    }
    return new Error(FALLBACK);
  }

  if (error instanceof Error && error.message.trim()) {
    return error;
  }

  return new Error(FALLBACK);
}
