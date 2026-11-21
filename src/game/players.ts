import type { Player } from './types';

/** Seat number (1-based) of a player, or 0 if not found. */
export function seatOf(players: Player[], id: string): number {
  return players.findIndex((p) => p.id === id) + 1;
}

/** True when the player still has the automatic name ("#5") or none at all. */
export function isDefaultName(name: string, seat: number): boolean {
  const n = name.trim();
  return n === '' || n === `#${seat}`;
}

/** The name to show next to the seat number, or '' when it would only repeat the number. */
export function displayName(player: Player, seat: number): string {
  return isDefaultName(player.name, seat) ? '' : player.name.trim();
}

/** Plain-text label, number first: "#5 Anna", or "#5" for a default name. */
export function playerText(players: Player[], id: string): string {
  const seat = seatOf(players, id);
  const p = players[seat - 1];
  if (!p) return '?';
  const name = displayName(p, seat);
  return name ? `#${seat} ${name}` : `#${seat}`;
}
