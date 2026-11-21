import { describe, expect, it } from 'vitest';
import { assignRoles, rolePool, shuffle } from '../assign';
import { suggestRoleCounts } from '../roles';
import { p } from './helpers';

describe('rolePool', () => {
  it('expands counts', () => {
    expect(rolePool({ mafia: 2, doctor: 1, civilian: 0 }).sort()).toEqual(['doctor', 'mafia', 'mafia']);
  });
});

describe('shuffle', () => {
  it('keeps every element', () => {
    const a = [1, 2, 3, 4, 5, 6];
    expect(shuffle(a).sort()).toEqual(a);
  });
});

describe('assignRoles', () => {
  it('gives each player exactly one role from the pool', () => {
    const players = Array.from({ length: 8 }, (_, i) => ({ ...p(`p${i}`, ''), roleId: null }));
    const counts = { mafia: 2, doctor: 1, sheriff: 1, civilian: 4 };
    const result = assignRoles(players, counts);
    expect(result.map((x) => x.roleId).sort()).toEqual(rolePool(counts).sort());
  });

  it('keeps locked players and removes their role from the pool', () => {
    const players = [{ ...p('a', 'doctor'), locked: true }, { ...p('b', ''), roleId: null }, { ...p('c', ''), roleId: null }];
    for (let i = 0; i < 20; i++) {
      const result = assignRoles(players, { doctor: 1, mafia: 1, civilian: 1 });
      expect(result[0].roleId).toBe('doctor');
      expect(result.slice(1).map((x) => x.roleId).sort()).toEqual(['civilian', 'mafia']);
    }
  });
});

describe('suggestRoleCounts', () => {
  it.each([4, 6, 8, 10, 12, 16, 20])('sums to the player count for %i players', (n) => {
    const counts = suggestRoleCounts(n);
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(n);
    expect(counts.mafia + counts.don).toBeGreaterThanOrEqual(1);
  });
});
