import { useEffect, useState, useCallback } from 'react';

/**
 * Production-grade debounce hook for deferred execution.
 * Delays calling a callback until the value has remained stable for the specified delay.
 * Useful for search inputs, form submissions, and other expensive operations.
 */
export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}

/**
 * Debounce callback hook that delays executing a function until the value has remained stable.
 * Useful when you need to perform side effects (like router updates) on debounced values.
 */
export function useDebouncedCallback<T>(
  value: T,
  callback: (value: T) => void,
  delayMs: number = 300
) {
  useEffect(() => {
    const timer = setTimeout(() => {
      callback(value);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [value, callback, delayMs]);
}
