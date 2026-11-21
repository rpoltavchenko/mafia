import { BUILTIN_ROLES } from '../roles';
import { initialState } from '../reducer';
import type { GameState, Player } from '../types';

export function p(id: string, roleId: string, alive = true): Player {
  return { id, name: id, roleId, alive, fouls: 0, seen: false, locked: false };
}

/** A game in progress with the given players, at night of round 1. */
export function gameWith(players: Player[]): GameState {
  return { ...initialState(players.length), players, roles: BUILTIN_ROLES.map((r) => ({ ...r })), phase: 'night', round: 1 };
}
