import type { Player } from './types';

export function shuffle<T>(arr: T[], rand: () => number = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Expand role counts into a flat list of role ids. */
export function rolePool(roleCounts: Record<string, number>): string[] {
  const pool: string[] = [];
  for (const [id, count] of Object.entries(roleCounts)) {
    for (let i = 0; i < count; i++) pool.push(id);
  }
  return pool;
}

/**
 * Randomly assign roles to all unlocked players. Locked players keep their role,
 * and that role is taken out of the pool first.
 */
export function assignRoles(
  players: Player[],
  roleCounts: Record<string, number>,
  rand: () => number = Math.random,
): Player[] {
  const pool = rolePool(roleCounts);
  for (const p of players) {
    if (p.locked && p.roleId) {
      const idx = pool.indexOf(p.roleId);
      if (idx >= 0) pool.splice(idx, 1);
    }
  }
  const shuffled = shuffle(pool, rand);
  let k = 0;
  return players.map((p) => {
    if (p.locked && p.roleId) return p;
    return { ...p, roleId: shuffled[k++] ?? null, seen: false };
  });
}
