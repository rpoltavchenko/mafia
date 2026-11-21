import type { RoleDef } from './types';

/** Role colours are CSS tokens so each theme can tune them (see tokens.css). */
export const BUILTIN_ROLES: RoleDef[] = [
  { id: 'civilian', team: 'town', nightAction: 'none', color: 'var(--role-civilian)' },
  { id: 'mafia', team: 'mafia', nightAction: 'kill', color: 'var(--role-mafia)' },
  { id: 'don', team: 'mafia', nightAction: 'donCheck', color: 'var(--role-don)' },
  { id: 'sheriff', team: 'town', nightAction: 'check', color: 'var(--role-sheriff)' },
  { id: 'doctor', team: 'town', nightAction: 'heal', color: 'var(--role-doctor)' },
  { id: 'maniac', team: 'neutral', nightAction: 'kill', color: 'var(--role-maniac)' },
  { id: 'lover', team: 'town', nightAction: 'none', color: 'var(--role-lover)' },
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

/** Custom roles cycle through these theme-aware colours (see tokens.css). */
export const CUSTOM_COLORS = Array.from({ length: 7 }, (_, i) => `var(--role-custom-${i + 1})`);
