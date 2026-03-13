import { useState, useEffect } from 'react';

/**
 * Returns a debounced version of `value` — only updates after `delay` ms of no changes.
 * Default delay: 120ms (fast enough for suggestions, avoids thrashing).
 */
export function useDebouncedValue<T>(value: T, delay = 120): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
