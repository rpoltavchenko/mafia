import type { RoleDef } from './types';

export const BUILTIN_ROLES: RoleDef[] = [
  { id: 'civilian', team: 'town', nightAction: 'none', color: '#4f9d69' },
  { id: 'mafia', team: 'mafia', nightAction: 'kill', color: '#d64545' },
  { id: 'don', team: 'mafia', nightAction: 'donCheck', color: '#8f1d1d' },
  { id: 'sheriff', team: 'town', nightAction: 'check', color: '#e0a526' },
  { id: 'doctor', team: 'town', nightAction: 'heal', color: '#3c8ddb' },
  { id: 'maniac', team: 'neutral', nightAction: 'kill', color: '#9b59b6' },
  { id: 'lover', team: 'town', nightAction: 'none', color: '#e86aa6' },
];

/** Order in which roles wake up at night. Custom roles go after these. */
export const NIGHT_ORDER = ['mafia', 'don', 'sheriff', 'doctor', 'maniac'];

/** Suggested role distribution for a player count. */
export function suggestRoleCounts(n: number): Record<string, number> {
  const mafiaTeam = Math.max(1, Math.round(n / 3.5));
  const counts: Record<string, number> = {};
  const hasDon = n >= 7;
  counts.don = hasDon ? 1 : 0;
  counts.mafia = mafiaTeam - counts.don;
  counts.sheriff = n >= 5 ? 1 : 0;
  counts.doctor = n >= 6 ? 1 : 0;
  counts.maniac = n >= 12 ? 1 : 0;
  counts.lover = 0;
  const used = Object.values(counts).reduce((a, b) => a + b, 0);
  counts.civilian = Math.max(0, n - used);
  return counts;
}

export const CUSTOM_COLORS = ['#16a085', '#d35400', '#7f8c8d', '#c0392b', '#2980b9', '#8e44ad', '#27ae60'];
