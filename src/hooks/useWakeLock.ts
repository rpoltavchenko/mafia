import { useEffect } from 'react';

/**
 * Keeps the screen on while `active` (e.g. while a speech timer runs), where the browser
 * supports the Screen Wake Lock API. The browser drops the lock when the page is hidden,
 * so it is taken again when the page comes back.
 */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const request = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const l = await navigator.wakeLock.request('screen');
        if (cancelled) l.release();
        else lock = l;
      } catch {
        /* denied (e.g. battery saver): the timer still works, the screen may just dim */
      }
    };
    const onVisible = () => {
      if (!lock || lock.released) request();
    };
    request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      lock?.release();
    };
  }, [active]);
}
