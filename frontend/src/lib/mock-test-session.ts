import type { MockTestResult, MockTestStartData } from '@/types';

/**
 * Mock-test session storage — the one sanctioned use of sessionStorage in the app.
 *
 * Both keys are a one-shot handoff between two pages, not a persistence layer:
 *  - `mocktest_start` is written right after the start API call succeeds (on the
 *    confirm screen) and read exactly once, synchronously, on the attempt page's
 *    first render — so the attempt route never shows its own loading spinner.
 *  - `mocktest_result` is written after submit succeeds and read once on the
 *    result page.
 *
 * Neither key is meant to survive a refresh of the page that reads it: the
 * attempt page removes `mocktest_start` as soon as it consumes it, and the
 * result page's key is cleared only by an explicit next action (never a
 * component-unmount side effect — cleanup functions run twice under React 18
 * Strict Mode in development, which would wipe the result before it ever
 * renders). Everything is best-effort and SSR-safe (guards `window`).
 */

const START_KEY = 'mocktest_start';
const RESULT_KEY = 'mocktest_result';

function hasStorage(): boolean {
  return typeof window !== 'undefined' && !!window.sessionStorage;
}

export function saveMockStart(data: MockTestStartData): void {
  if (!hasStorage()) return;
  sessionStorage.setItem(START_KEY, JSON.stringify(data));
}

/** Reads and immediately clears the pending start payload — call at most once per attempt. */
export function consumeMockStart(): MockTestStartData | null {
  if (!hasStorage()) return null;
  const raw = sessionStorage.getItem(START_KEY);
  sessionStorage.removeItem(START_KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as MockTestStartData;
    if (!data?.questions?.length) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveMockResult(result: MockTestResult): void {
  if (!hasStorage()) return;
  sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
}

export function getMockResult(): MockTestResult | null {
  if (!hasStorage()) return null;
  const raw = sessionStorage.getItem(RESULT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MockTestResult;
  } catch {
    return null;
  }
}

/** Call only from an explicit user action (Try Again) — never from an unmount/cleanup effect. */
export function clearMockResult(): void {
  if (!hasStorage()) return;
  sessionStorage.removeItem(RESULT_KEY);
}
