import { reducer, type Action } from './reducer';
import type { GameState, Phase } from './types';

/** How many game actions can be undone in a row. */
export const UNDO_LIMIT = 30;

export interface UndoEntry {
  /** The game as it was before `action` */
  state: GameState;
  action: Action;
}

export interface History {
  present: GameState;
  /** Oldest first; the last entry is the next one to undo */
  past: UndoEntry[];
  /** True right after an undo (the phase curtain isn't shown for it) */
  restored: boolean;
}

export type HistoryAction = Action | { type: 'UNDO' };

const IN_GAME: Phase[] = ['night', 'day', 'voting'];

/** Actions that start over: nothing before them can be undone. */
const CLEARS: Action['type'][] = ['RESET', 'LOAD', 'NEW_GAME_SAME_PLAYERS'];

/** Repeated taps on the same vote stepper count as one action. */
function merges(prev: Action, next: Action): boolean {
  return prev.type === 'SET_VOTES' && next.type === 'SET_VOTES' && prev.id === next.id;
}

/**
 * Game actions (anything done during a night, day or vote, including ending the game)
 * can be undone one at a time. Setup, role assignment and reveal are not recorded.
 */
export function historyReducer(h: History, action: HistoryAction): History {
  if (action.type === 'UNDO') {
    const last = h.past[h.past.length - 1];
    if (!last) return h;
    return { present: last.state, past: h.past.slice(0, -1), restored: true };
  }

  const next = reducer(h.present, action);
  // e.g. a foul below zero or a blocked phase change: nothing to record
  if (next === h.present || JSON.stringify(next) === JSON.stringify(h.present)) return h;

  const recordable = IN_GAME.includes(h.present.phase) && (IN_GAME.includes(next.phase) || next.phase === 'ended');
  if (!recordable || CLEARS.includes(action.type)) return { present: next, past: [], restored: false };

  const last = h.past[h.past.length - 1];
  if (last && !h.restored && merges(last.action, action)) {
    return { present: next, past: [...h.past.slice(0, -1), { state: last.state, action }], restored: false };
  }
  const past = [...h.past, { state: h.present, action }].slice(-UNDO_LIMIT);
  return { present: next, past, restored: false };
}

export function initialHistory(present: GameState, past: UndoEntry[] = []): History {
  return { present, past, restored: false };
}
