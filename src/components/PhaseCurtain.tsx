import { useEffect, useRef, useState } from 'react';
import { useGame } from '../game/GameContext';
import { useI18n } from '../i18n/I18nContext';

const ICONS = { night: '🌙', day: '☀️', voting: '🗳️' } as const;

/**
 * A short full-screen "Night 2 — the city falls asleep" moment whenever the phase
 * changes. Not shown on page load, only on a real phase change. Tap to dismiss.
 */
export default function PhaseCurtain() {
  const { state } = useGame();
  const { tk } = useI18n();
  const key = `${state.phase}-${state.round}`;
  const prevKey = useRef<string | null>(null);
  const [shown, setShown] = useState<string | null>(null);

  useEffect(() => {
    // Only on a real phase change — not on page load (and not on React's dev double-run)
    const prev = prevKey.current;
    prevKey.current = key;
    if (prev === null || prev === key) return;
    if (state.phase !== 'night' && state.phase !== 'day' && state.phase !== 'voting') return;
    setShown(key);
    const id = window.setTimeout(() => setShown(null), 1900);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!shown) return null;
  const phase = state.phase as keyof typeof ICONS;
  return (
    <div className={`curtain curtain-${phase}`} onClick={() => setShown(null)} role="status">
      <div className="curtain-inner">
        <span className="curtain-icon" aria-hidden>
          {ICONS[phase]}
        </span>
        <strong className="curtain-title">{tk(`curtain.${phase}`, { round: state.round })}</strong>
        <span className="curtain-sub">
          {tk(state.round === 0 && phase === 'night' ? 'curtain.introSub' : state.round === 0 && phase === 'day' ? 'curtain.dayZeroSub' : `curtain.${phase}Sub`)}
        </span>
      </div>
    </div>
  );
}
