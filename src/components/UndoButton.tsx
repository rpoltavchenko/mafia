import { useEffect, useRef } from 'react';
import { useGame } from '../game/GameContext';
import { playerText } from '../game/players';
import type { Action } from '../game/reducer';
import type { Phase, Player } from '../game/types';
import { useI18n } from '../i18n/I18nContext';

/** Who an action is about, for actions that name a player in the Undo label. */
function subject(action: Action): string | null {
  switch (action.type) {
    case 'SET_VOTES':
    case 'KILL_PLAYER':
    case 'REVIVE_PLAYER':
    case 'FOUL':
      return action.id;
    default:
      return null;
  }
}

function describe(action: Action, from: Phase | null, players: Player[], tk: (key: string, params?: Record<string, string>) => string): string {
  // Day 0 has no voting: it goes straight to Night 1
  const key = action.type === 'FINISH_VOTING' && from === 'day' ? 'undo.END_DAY' : `undo.${action.type}`;
  const id = subject(action);
  const what = tk(key, id ? { name: playerText(players, id) } : undefined);
  return what === key ? tk('undo.other') : what;
}

/**
 * Takes back the last game action. Ctrl/⌘+Z does the same while the game tab is open.
 * `small` is the game-header size (icon only on phones); otherwise a regular button.
 */
export default function UndoButton({ small = false }: { small?: boolean }) {
  const { state, lastAction, undoPhase, undo } = useGame();
  const { t, tk } = useI18n();
  const label = lastAction ? t('game.undoWhat', { what: describe(lastAction, undoPhase, state.players, tk) }) : t('game.undoNone');

  const undoRef = useRef<(() => void) | null>(null);
  undoRef.current = lastAction ? undo : null;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.shiftKey || e.altKey || e.key.toLowerCase() !== 'z') return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (document.body.dataset.view && document.body.dataset.view !== 'game') return;
      if (!undoRef.current) return;
      e.preventDefault();
      undoRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <button
      className={`btn btn-ghost undo-btn ${small ? 'btn-sm' : ''}`}
      onClick={undo}
      disabled={!lastAction}
      aria-label={label}
      title={label}
    >
      <span aria-hidden>↩️</span>
      <span className="btn-label">{t('game.undo')}</span>
    </button>
  );
}
