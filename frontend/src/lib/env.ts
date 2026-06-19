/**
 * Single source of truth for frontend environment variables.
 * Import `env` from here instead of reading `process.env` directly.
 *
 * Note: only NEXT_PUBLIC_* vars are available in the browser, and Next.js
 * inlines them at build time, so they must be referenced as full literals.
 */
export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api',
} as const;
