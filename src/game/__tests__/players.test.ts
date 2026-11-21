import { describe, expect, it } from 'vitest';
import { displayName, isDefaultName, playerText, seatOf } from '../players';
import { p } from './helpers';

describe('player labels', () => {
  const players = [{ ...p('a', 'civilian'), name: 'Anna' }, { ...p('b', 'mafia'), name: '#2' }, { ...p('c', 'doctor'), name: '  ' }];

  it('finds seat numbers', () => {
    expect(seatOf(players, 'b')).toBe(2);
    expect(seatOf(players, 'x')).toBe(0);
  });
  it('treats "#N" and blank names as default', () => {
    expect(isDefaultName('#2', 2)).toBe(true);
    expect(isDefaultName('#3', 2)).toBe(false);
    expect(isDefaultName('  ', 3)).toBe(true);
    expect(displayName(players[0], 1)).toBe('Anna');
    expect(displayName(players[1], 2)).toBe('');
  });
  it('formats number first', () => {
    expect(playerText(players, 'a')).toBe('#1 Anna');
    expect(playerText(players, 'b')).toBe('#2');
    expect(playerText(players, 'c')).toBe('#3');
    expect(playerText(players, 'x')).toBe('?');
  });
});
