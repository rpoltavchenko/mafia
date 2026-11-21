import { DEFAULT_SETTINGS } from './reducer';
import type { GameState } from './types';

const KEY = 'mafia-game-v1';

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (parsed?.version !== 1 || !Array.isArray(parsed.players) || !Array.isArray(parsed.roles)) return null;
    // Fill in fields added in later versions of the app
    return {
      ...parsed,
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      speech: { ...parsed.speech, discussionDone: parsed.speech?.discussionDone ?? true },
      vote: { ...parsed.vote, nominatedBy: parsed.vote?.nominatedBy ?? {} },
    };
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
