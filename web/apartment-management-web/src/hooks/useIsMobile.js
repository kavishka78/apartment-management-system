import { useSyncExternalStore } from 'react';

const mobileQuery = '(max-width: 750px)';

function subscribe(onChange) {
  const mediaQuery = window.matchMedia(mobileQuery);
  mediaQuery.addEventListener('change', onChange);
  return () => mediaQuery.removeEventListener('change', onChange);
}

function getSnapshot() {
  return window.matchMedia(mobileQuery).matches;
}

function getServerSnapshot() {
  return false;
}

export default function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
