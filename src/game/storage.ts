import type { UndoEntry } from './history';
import { DEFAULT_SETTINGS } from './reducer';
import { BUILTIN_ROLES } from './roles';
import type { GameState } from './types';

const KEY = 'mafia-game-v1';
const UNDO_KEY = 'mafia-undo-v1';

/** Validates a saved game and fills in fields added in later versions of the app. */
function normalize(parsed: GameState): GameState | null {
  if (parsed?.version !== 1 || !Array.isArray(parsed.players) || !Array.isArray(parsed.roles)) return null;
  return {
    ...parsed,
    settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
    // Built-in roles always take their colour from the current theme tokens
    roles: parsed.roles.map((r) => {
      const builtin = BUILTIN_ROLES.find((b) => b.id === r.id);
      return builtin && !r.custom ? { ...r, color: builtin.color } : r;
    }),
    speech: { ...parsed.speech, discussionDone: parsed.speech?.discussionDone ?? true },
    vote: { ...parsed.vote, nominatedBy: parsed.vote?.nominatedBy ?? {} },
    lastHeals: parsed.lastHeals ?? {},
    checks: parsed.checks ?? [],
  };
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? normalize(JSON.parse(raw) as GameState) : null;
  } catch {
    return null;
  }
}

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable (private mode) – the game still works, just isn't saved */
  }
}

/** Identifies a game position, so undo steps are only restored for the game they belong to. */
function signature(s: GameState): string {
  return JSON.stringify([s.phase, s.round, s.log.length, s.players.map((p) => [p.id, p.alive])]);
}

export function loadUndo(present: GameState): UndoEntry[] {
  try {
    const raw = localStorage.getItem(UNDO_KEY);
    if (!raw) return [];
    const saved = JSON.parse(raw) as { for: string; past: UndoEntry[] };
    if (saved.for !== signature(present) || !Array.isArray(saved.past)) return [];
    const past: UndoEntry[] = [];
    for (const e of saved.past) {
      const state = normalize(e.state);
      if (!state || !e.action) return [];
      past.push({ state, action: e.action });
    }
    return past;
  } catch {
    return [];
  }
}

export function saveUndo(present: GameState, past: UndoEntry[]): void {
  try {
    if (past.length === 0) localStorage.removeItem(UNDO_KEY);
    else localStorage.setItem(UNDO_KEY, JSON.stringify({ for: signature(present), past }));
  } catch {
    /* undo still works until the page is reloaded */
  }
}
