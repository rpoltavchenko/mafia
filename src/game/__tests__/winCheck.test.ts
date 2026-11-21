import { describe, expect, it } from 'vitest';
import { BUILTIN_ROLES } from '../roles';
import { checkWinner } from '../winCheck';
import { p } from './helpers';

const roles = BUILTIN_ROLES;

describe('checkWinner', () => {
  it('town wins when no mafia or maniac is alive', () => {
    expect(checkWinner([p('a', 'mafia', false), p('b', 'civilian'), p('c', 'doctor')], roles)).toBe('town');
  });
  it('mafia wins at parity', () => {
    expect(checkWinner([p('a', 'mafia'), p('b', 'civilian'), p('c', 'civilian', false)], roles)).toBe('mafia');
  });
  it('game goes on while mafia is outnumbered', () => {
    expect(checkWinner([p('a', 'mafia'), p('b', 'civilian'), p('c', 'sheriff')], roles)).toBeNull();
  });
  it('maniac blocks a mafia win', () => {
    expect(checkWinner([p('a', 'mafia'), p('b', 'maniac'), p('c', 'civilian')], roles)).toBeNull();
  });
  it('maniac wins when left one on one with town', () => {
    expect(checkWinner([p('a', 'maniac'), p('b', 'civilian'), p('c', 'mafia', false)], roles)).toBe('neutral');
  });
});
