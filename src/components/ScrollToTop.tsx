import { useEffect } from 'react';

interface ScrollToTopProps {
  dependencies?: any[];
}

/**
 * ScrollToTop component:
 * Automatically resets window scroll position to the top (0, 0)
 * whenever view state or location dependencies change.
 */
export default function ScrollToTop({ dependencies = [] }: ScrollToTopProps) {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, dependencies);

  return null;
}
