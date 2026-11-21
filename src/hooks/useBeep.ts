import { useCallback, useRef } from 'react';

/** Beeps with a Web Audio oscillator – no audio files needed. */
export function useBeep(enabled: boolean, vibrate: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  const ensure = useCallback(() => {
    if (!ctxRef.current) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctxRef.current = new AC();
    }
    if (ctxRef.current.state === 'suspended') void ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const tone = useCallback(
    (freq: number, startAt: number, durMs: number, volume = 0.25) => {
      const ctx = ensure();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t0 = ctx.currentTime + startAt;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(volume, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durMs / 1000);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + durMs / 1000 + 0.05);
    },
    [ensure],
  );

  /** Call from a click handler so browsers allow audio later */
  const unlock = useCallback(() => {
    if (enabled) ensure();
  }, [enabled, ensure]);

  const warn = useCallback(() => {
    if (enabled) tone(660, 0, 150, 0.15);
    if (vibrate) navigator.vibrate?.(150);
  }, [enabled, vibrate, tone]);

  const timeUp = useCallback(() => {
    if (enabled) {
      tone(880, 0, 250);
      tone(880, 0.35, 250);
      tone(1175, 0.7, 500);
    }
    if (vibrate) navigator.vibrate?.([300, 120, 300, 120, 500]);
  }, [enabled, vibrate, tone]);

  return { unlock, warn, timeUp };
}
