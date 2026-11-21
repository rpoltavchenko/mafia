import { useCallback, useEffect, useRef, useState } from 'react';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'expired';

interface Options {
  onExpire?: () => void;
  /** Called once when the remaining time first drops to or below `warnAtSec` */
  onWarn?: () => void;
  warnAtSec?: number;
}

/**
 * Countdown that stores a target timestamp rather than counting ticks,
 * so it stays accurate when the tab is throttled in the background.
 */
export function useTimer(durationSec: number, { onExpire, onWarn, warnAtSec = 10 }: Options = {}) {
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [endsAt, setEndsAt] = useState(0);
  const [remainingMs, setRemainingMs] = useState(durationSec * 1000);
  const [totalMs, setTotalMs] = useState(durationSec * 1000);
  const warned = useRef(false);
  const cbs = useRef({ onExpire, onWarn });
  cbs.current = { onExpire, onWarn };

  useEffect(() => {
    if (status !== 'running') return;
    const tick = () => {
      const left = endsAt - Date.now();
      if (left <= 0) {
        setRemainingMs(0);
        setStatus('expired');
        cbs.current.onExpire?.();
        return;
      }
      setRemainingMs(left);
      if (!warned.current && left <= warnAtSec * 1000 && totalMs > warnAtSec * 1000) {
        warned.current = true;
        cbs.current.onWarn?.();
      }
    };
    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [status, endsAt, warnAtSec, totalMs]);

  const reset = useCallback(() => {
    setStatus('idle');
    setRemainingMs(durationSec * 1000);
    setTotalMs(durationSec * 1000);
    warned.current = false;
  }, [durationSec]);

  // A new duration (e.g. a different timer type) resets the countdown
  useEffect(reset, [reset]);

  const start = useCallback(() => {
    const fresh = status === 'expired' || status === 'idle';
    const ms = fresh ? durationSec * 1000 : remainingMs;
    if (fresh) {
      setTotalMs(durationSec * 1000);
      warned.current = false;
    }
    setEndsAt(Date.now() + ms);
    setRemainingMs(ms);
    setStatus('running');
  }, [status, remainingMs, durationSec]);

  /** Start a fresh countdown from the full duration, whatever the current state. */
  const restart = useCallback(() => {
    const ms = durationSec * 1000;
    warned.current = false;
    setTotalMs(ms);
    setRemainingMs(ms);
    setEndsAt(Date.now() + ms);
    setStatus('running');
  }, [durationSec]);

  const pause = useCallback(() => {
    if (status !== 'running') return;
    setRemainingMs(Math.max(0, endsAt - Date.now()));
    setStatus('paused');
  }, [status, endsAt]);

  const toggle = useCallback(() => (status === 'running' ? pause() : start()), [status, pause, start]);

  const addTime = useCallback(
    (sec: number) => {
      const ms = sec * 1000;
      if (status === 'running') {
        setEndsAt((e) => e + ms);
        setRemainingMs((r) => r + ms);
      } else if (status === 'expired') {
        setRemainingMs(ms);
        setStatus('paused');
      } else {
        setRemainingMs((r) => r + ms);
      }
      setTotalMs((tot) => Math.max(tot, (status === 'expired' ? 0 : remainingMs) + ms));
      if (status !== 'expired' && remainingMs + ms > warnAtSec * 1000) warned.current = false;
    },
    [status, remainingMs, warnAtSec],
  );

  return { status, remainingMs, totalMs, start, restart, pause, toggle, reset, addTime };
}
