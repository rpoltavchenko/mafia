import { useEffect, useRef } from 'react';

interface Handlers {
  toggle: () => void;
  next?: () => void;
  prev?: () => void;
}

/** Keyboard: Space = start/pause, N or → = next, ← = previous. Ignored while typing. */
export function useTimerKeys(handlers: Handlers) {
  const ref = useRef(handlers);
  ref.current = handlers;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      // Timers keep running in the background while the Rules / Host lines tabs are open
      if (document.body.dataset.view && document.body.dataset.view !== 'game') return;
      if (e.code === 'Space') {
        e.preventDefault();
        ref.current.toggle();
      } else if (['n', 'N', 'т', 'Т', 'ArrowRight'].includes(e.key)) {
        ref.current.next?.();
      } else if (e.key === 'ArrowLeft') {
        ref.current.prev?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
