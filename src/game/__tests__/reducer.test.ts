import { describe, expect, it } from 'vitest';
import { nightSteps } from '../night';
import { effectiveVotes, initialState, reducer, rolesTotal, speakingOrder } from '../reducer';
import type { GameState } from '../types';
import { gameWith, p } from './helpers';

describe('setup', () => {
  it('resizes players and re-suggests roles', () => {
    let s = initialState(10);
    s = reducer(s, { type: 'SET_PLAYER_COUNT', count: 7 });
    expect(s.players).toHaveLength(7);
    expect(rolesTotal(s.roleCounts)).toBe(7);
  });

  it('clamps player count', () => {
    const s = reducer(initialState(10), { type: 'SET_PLAYER_COUNT', count: 99 });
    expect(s.players).toHaveLength(20);
  });

  it('only goes to assign when role total matches player count', () => {
    let s = initialState(8);
    s = reducer(s, { type: 'SET_ROLE_COUNT', roleId: 'civilian', count: 0 });
    expect(reducer(s, { type: 'GO_ASSIGN' }).phase).toBe('setup');
    s = reducer(s, { type: 'SUGGEST_ROLES' });
    const assigned = reducer(s, { type: 'GO_ASSIGN' });
    expect(assigned.phase).toBe('assign');
    expect(assigned.players.every((x) => x.roleId)).toBe(true);
  });

  it('adds and removes custom roles', () => {
    let s = reducer(initialState(8), { type: 'ADD_CUSTOM_ROLE', name: 'Bodyguard', team: 'town', nightAction: 'heal' });
    const role = s.roles.find((r) => r.name === 'Bodyguard')!;
    expect(s.roleCounts[role.id]).toBe(1);
    s = reducer(s, { type: 'REMOVE_ROLE', roleId: role.id });
    expect(s.roles.find((r) => r.id === role.id)).toBeUndefined();
    expect(s.roleCounts[role.id]).toBeUndefined();
  });
});

describe('night', () => {
  const players = [p('m1', 'mafia'), p('don', 'don'), p('sh', 'sheriff'), p('doc', 'doctor'), p('c1', 'civilian'), p('c2', 'civilian'), p('c3', 'civilian')];

  it('builds steps in wake-up order', () => {
    expect(nightSteps(players, gameWith(players).roles).map((s) => s.id)).toEqual(['mafia', 'don', 'sheriff', 'doctor']);
  });

  it('mafia kill lands when not healed', () => {
    let s = gameWith(players);
    s = reducer(s, { type: 'NIGHT_TARGET', stepId: 'mafia', targetId: 'c1' });
    s = reducer(s, { type: 'NIGHT_TARGET', stepId: 'doctor', targetId: 'c2' });
    s = reducer(s, { type: 'RESOLVE_NIGHT' });
    expect(s.phase).toBe('day');
    expect(s.players.find((x) => x.id === 'c1')!.alive).toBe(false);
    expect(s.log.some((l) => l.key === 'log.killed')).toBe(true);
    expect(s.speech.queue).not.toContain('c1');
  });

  it('doctor save cancels the kill', () => {
    let s = gameWith(players);
    s = reducer(s, { type: 'NIGHT_TARGET', stepId: 'mafia', targetId: 'c1' });
    s = reducer(s, { type: 'NIGHT_TARGET', stepId: 'doctor', targetId: 'c1' });
    s = reducer(s, { type: 'RESOLVE_NIGHT' });
    expect(s.players.every((x) => x.alive)).toBe(true);
    expect(s.log.map((l) => l.key)).toEqual(expect.arrayContaining(['log.saved', 'log.quietNight']));
  });

  it('logs sheriff and don checks', () => {
    let s = gameWith(players);
    s = reducer(s, { type: 'NIGHT_TARGET', stepId: 'sheriff', targetId: 'm1' });
    s = reducer(s, { type: 'NIGHT_TARGET', stepId: 'don', targetId: 'sh' });
    s = reducer(s, { type: 'RESOLVE_NIGHT' });
    const checks = s.log.filter((l) => l.key.startsWith('log.check'));
    expect(checks.map((c) => [c.params!.role, c.key])).toEqual([
      ['don', 'log.checkPositive'],
      ['sheriff', 'log.checkPositive'],
    ]);
  });

  it('ends the game when the mafia reaches parity', () => {
    let s = gameWith([p('m', 'mafia'), p('a', 'civilian'), p('b', 'civilian')]);
    s = reducer(s, { type: 'NIGHT_TARGET', stepId: 'mafia', targetId: 'a' });
    s = reducer(s, { type: 'RESOLVE_NIGHT' });
    expect(s.phase).toBe('ended');
    expect(s.winner).toBe('mafia');
  });
});

describe('day and voting', () => {
  // 10 players: 2 mafia, 8 civilians
  const players = [p('m1', 'mafia'), p('m2', 'mafia'), ...Array.from({ length: 8 }, (_, i) => p(`c${i + 1}`, 'civilian'))];
  const day = (): GameState => ({ ...gameWith(players), phase: 'day' });
  const vote = (s: GameState, nominees: string[]) => {
    for (const id of nominees) s = reducer(s, { type: 'TOGGLE_NOMINEE', id });
    return reducer(s, { type: 'START_VOTE' });
  };

  it('rotates the first speaker each round', () => {
    expect(speakingOrder(players, 1)[0]).toBe('m1');
    expect(speakingOrder(players, 2)[0]).toBe('m2');
    expect(speakingOrder(players, 11)[0]).toBe('m1');
  });

  it('starts each day with an open discussion', () => {
    let s = gameWith(players);
    s = reducer(s, { type: 'RESOLVE_NIGHT' });
    expect(s.speech.discussionDone).toBe(false);
    s = reducer(s, { type: 'END_DISCUSSION' });
    expect(s.speech.discussionDone).toBe(true);
  });

  it('lets each speaker nominate one player, and keeps nominations for voting', () => {
    let s = day();
    s = reducer(s, { type: 'NOMINATE', by: 'c1', target: 'm1' });
    s = reducer(s, { type: 'NOMINATE', by: 'c2', target: 'm1' }); // already nominated – ignored
    s = reducer(s, { type: 'NOMINATE', by: 'c3', target: 'c4' });
    s = reducer(s, { type: 'NOMINATE', by: 'c3', target: 'm2' }); // c3 changes their mind
    expect(s.vote.nominees).toEqual(['m1', 'm2']);
    expect(s.vote.nominatedBy).toEqual({ m1: 'c1', m2: 'c3' });
    s = reducer(s, { type: 'NOMINATE', by: 'c1', target: null }); // c1 withdraws
    expect(s.vote.nominees).toEqual(['m2']);
    s = reducer(s, { type: 'GO_VOTING' });
    expect(s.vote.nominees).toEqual(['m2']);
  });

  it('gives all remaining votes to the last nominee', () => {
    // 10 alive, 3 nominees, votes 2 and 2 → last nominee gets 6
    let s = vote(reducer(day(), { type: 'GO_VOTING' }), ['m1', 'c1', 'c2']);
    s = reducer(s, { type: 'SET_VOTES', id: 'm1', votes: 2 });
    s = reducer(s, { type: 'SET_VOTES', id: 'c1', votes: 2 });
    expect(effectiveVotes(s)).toEqual({ m1: 2, c1: 2, c2: 6 });
    s = reducer(s, { type: 'RESOLVE_VOTE' });
    expect(s.vote.eliminated).toEqual(['c2']);
  });

  it('eliminates the top-voted player and moves to the next night', () => {
    let s = vote(reducer(day(), { type: 'GO_VOTING' }), ['m1', 'c1']);
    s = reducer(s, { type: 'SET_VOTES', id: 'm1', votes: 7 });
    s = reducer(s, { type: 'RESOLVE_VOTE' });
    expect(s.vote.stage).toBe('lastWord');
    expect(s.vote.eliminated).toEqual(['m1']);
    expect(s.players.find((x) => x.id === 'm1')!.alive).toBe(false);
    s = reducer(s, { type: 'FINISH_VOTING' });
    expect(s.phase).toBe('night');
    expect(s.round).toBe(2);
  });

  it('goes to defense on a tie, then to a host decision on a second tie', () => {
    let s = vote(reducer(day(), { type: 'GO_VOTING' }), ['m1', 'c1', 'c2']);
    s = reducer(s, { type: 'SET_VOTES', id: 'm1', votes: 4 });
    s = reducer(s, { type: 'SET_VOTES', id: 'c1', votes: 4 }); // c2 gets the remaining 2
    s = reducer(s, { type: 'RESOLVE_VOTE' });
    expect(s.vote.stage).toBe('defense');
    expect(s.vote.nominees).toEqual(['m1', 'c1']);
    s = reducer(s, { type: 'START_REVOTE' });
    s = reducer(s, { type: 'SET_VOTES', id: 'm1', votes: 5 }); // c1 gets the remaining 5
    s = reducer(s, { type: 'RESOLVE_VOTE' });
    expect(s.vote.stage).toBe('tie');
    s = reducer(s, { type: 'ELIMINATE_ALL_TIED' });
    expect(s.vote.eliminated).toEqual(['m1', 'c1']);
  });

  it('town wins when the last mafia is voted out', () => {
    let s = gameWith([p('m', 'mafia', true), p('a', 'civilian'), p('b', 'civilian')]);
    s = vote(reducer({ ...s, phase: 'day' }, { type: 'GO_VOTING' }), ['m']);
    s = reducer(s, { type: 'RESOLVE_VOTE' }); // sole nominee receives all 3 votes
    s = reducer(s, { type: 'FINISH_VOTING' });
    expect(s.phase).toBe('ended');
    expect(s.winner).toBe('town');
  });
});

describe('new game', () => {
  it('keeps players and re-deals roles', () => {
    let s = reducer(initialState(8), { type: 'GO_ASSIGN' });
    s = reducer(s, { type: 'START_GAME' });
    s = reducer(s, { type: 'END_GAME', winner: 'town' });
    const names = s.players.map((x) => x.name);
    s = reducer(s, { type: 'NEW_GAME_SAME_PLAYERS' });
    expect(s.phase).toBe('assign');
    expect(s.players.map((x) => x.name)).toEqual(names);
    expect(s.players.every((x) => x.alive && x.roleId)).toBe(true);
    expect(s.log).toEqual([]);
  });
});
