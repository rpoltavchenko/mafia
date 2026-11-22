import { describe, expect, it } from 'vitest';
import { nightSteps } from '../night';
import { effectiveVotes, initialState, isIntroRound, reducer, rolesTotal, speakingOrder } from '../reducer';
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

  it('moves the first speaker one seat each day', () => {
    expect(speakingOrder(players, 0)[0]).toBe('m1');
    expect(speakingOrder(players, 1)[0]).toBe('m2');
    expect(speakingOrder(players, 10)[0]).toBe('m1');
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

describe('introduction round (Round 0)', () => {
  const start = (intro: boolean) => {
    let s = initialState(8);
    s = reducer(s, { type: 'SET_SETTINGS', settings: { introRound: intro } });
    s = reducer(s, { type: 'GO_ASSIGN' });
    return reducer(s, { type: 'START_GAME' });
  };

  it('starts at Night 0 when the setting is on', () => {
    const s = start(true);
    expect(s.phase).toBe('night');
    expect(s.round).toBe(0);
    expect(isIntroRound(s)).toBe(true);
  });

  it('starts at Night 1 when the setting is off', () => {
    const s = start(false);
    expect(s.round).toBe(1);
    expect(isIntroRound(s)).toBe(false);
  });

  it('Night 0 kills nobody and leads to Day 0 with speeches', () => {
    let s = start(true);
    const victim = s.players[0].id;
    s = reducer(s, { type: 'NIGHT_TARGET', stepId: 'mafia', targetId: victim }); // ignored on Night 0
    s = reducer(s, { type: 'END_INTRO_NIGHT' });
    expect(s.phase).toBe('day');
    expect(s.round).toBe(0);
    expect(s.players.every((p) => p.alive)).toBe(true);
    expect(s.speech.queue).toHaveLength(8);
    expect(s.speech.queue[0]).toBe(s.players[0].id);
    expect(s.log.map((l) => l.key)).toEqual(['log.introNight']);
  });

  it('RESOLVE_NIGHT on Night 0 behaves like the introduction', () => {
    let s = start(true);
    s = reducer(s, { type: 'NIGHT_TARGET', stepId: 'mafia', targetId: s.players[0].id });
    s = reducer(s, { type: 'RESOLVE_NIGHT' });
    expect(s.phase).toBe('day');
    expect(s.players.every((p) => p.alive)).toBe(true);
  });

  it('Day 0 has no voting and goes on to Night 1, then Day 1 starts one seat later', () => {
    let s = reducer(start(true), { type: 'END_INTRO_NIGHT' });
    expect(reducer(s, { type: 'GO_VOTING' }).phase).toBe('day');
    s = reducer(s, { type: 'FINISH_VOTING' });
    expect(s.phase).toBe('night');
    expect(s.round).toBe(1);
    s = reducer(s, { type: 'RESOLVE_NIGHT' });
    expect(s.phase).toBe('day');
    expect(s.speech.queue[0]).toBe(s.players[1].id);
  });
});

describe('player labels in the log', () => {
  it('always lead with the seat number', () => {
    let s = gameWith([p('m', 'mafia'), p('a', 'civilian'), p('b', 'civilian'), p('c', 'civilian')]);
    s = { ...s, players: s.players.map((x, i) => (i === 1 ? { ...x, name: 'Anna' } : { ...x, name: `#${i + 1}` })) };
    s = reducer(s, { type: 'NIGHT_TARGET', stepId: 'mafia', targetId: 'a' });
    s = reducer(s, { type: 'NIGHT_TARGET', stepId: 'mafia', targetId: 'a' });
    s = reducer(s, { type: 'RESOLVE_NIGHT' });
    expect(s.log.find((l) => l.key === 'log.killed')?.params?.name).toBe('#2 Anna');
    s = reducer({ ...s, phase: 'day' }, { type: 'GO_VOTING' });
    s = reducer(s, { type: 'TOGGLE_NOMINEE', id: 'c' });
    s = reducer(s, { type: 'START_VOTE' });
    s = reducer(s, { type: 'RESOLVE_VOTE' });
    // default names are not repeated next to the number
    expect(s.log.find((l) => l.key === 'log.votedOut')?.params?.name).toBe('#4');
  });
});

describe('night target rules', () => {
  const players = [p('m1', 'mafia'), p('don', 'don'), p('sh', 'sheriff'), p('doc', 'doctor'), p('man', 'maniac'), p('c1', 'civilian'), p('c2', 'civilian'), p('c3', 'civilian')];
  const target = (s: GameState, stepId: string, id: string) => reducer(s, { type: 'NIGHT_TARGET', stepId, targetId: id }).night.targets[stepId] ?? null;

  it('the Mafia cannot target their own team', () => {
    const s = gameWith(players);
    expect(target(s, 'mafia', 'm1')).toBeNull();
    expect(target(s, 'mafia', 'don')).toBeNull();
    expect(target(s, 'mafia', 'c1')).toBe('c1');
  });

  it('the Sheriff cannot check himself (nor the Don, nor the Maniac pick themselves)', () => {
    const s = gameWith(players);
    expect(target(s, 'sheriff', 'sh')).toBeNull();
    expect(target(s, 'sheriff', 'm1')).toBe('m1');
    expect(target(s, 'don', 'don')).toBeNull();
    expect(target(s, 'maniac', 'man')).toBeNull();
  });

  it('dead players cannot be chosen', () => {
    const s = gameWith(players.map((x) => (x.id === 'c1' ? { ...x, alive: false } : x)));
    expect(target(s, 'mafia', 'c1')).toBeNull();
  });

  it('the Doctor can heal himself, but not the same player two nights in a row', () => {
    let s = gameWith(players);
    expect(target(s, 'doctor', 'doc')).toBe('doc');
    s = reducer(s, { type: 'NIGHT_TARGET', stepId: 'doctor', targetId: 'doc' });
    s = reducer(s, { type: 'RESOLVE_NIGHT' });
    expect(s.lastHeals).toEqual({ doctor: 'doc' });

    // next night: himself is blocked, others are fine
    s = reducer({ ...s, phase: 'day' }, { type: 'FINISH_VOTING' });
    expect(s.phase).toBe('night');
    expect(target(s, 'doctor', 'doc')).toBeNull();
    expect(target(s, 'doctor', 'c2')).toBe('c2');
    s = reducer(s, { type: 'NIGHT_TARGET', stepId: 'doctor', targetId: 'c2' });
    s = reducer(s, { type: 'RESOLVE_NIGHT' });

    // the night after: himself is allowed again, c2 is blocked
    s = reducer({ ...s, phase: 'day' }, { type: 'FINISH_VOTING' });
    expect(target(s, 'doctor', 'doc')).toBe('doc');
    expect(target(s, 'doctor', 'c2')).toBeNull();
  });

  it('a night with no heal clears the restriction', () => {
    let s = gameWith(players);
    s = reducer(s, { type: 'NIGHT_TARGET', stepId: 'doctor', targetId: 'c1' });
    s = reducer(s, { type: 'RESOLVE_NIGHT' });
    s = reducer({ ...s, phase: 'day' }, { type: 'FINISH_VOTING' });
    s = reducer(s, { type: 'RESOLVE_NIGHT' }); // Doctor skips this night
    s = reducer({ ...s, phase: 'day' }, { type: 'FINISH_VOTING' });
    expect(target(s, 'doctor', 'c1')).toBe('c1');
  });

  it('a new game forgets last heals', () => {
    let s = gameWith(players);
    s = reducer(s, { type: 'NIGHT_TARGET', stepId: 'doctor', targetId: 'doc' });
    s = reducer(s, { type: 'RESOLVE_NIGHT' });
    s = reducer(s, { type: 'START_GAME' });
    expect(s.lastHeals).toEqual({});
  });
});

describe('check history', () => {
  const players = [p('m1', 'mafia'), p('don', 'don'), p('sh', 'sheriff'), p('doc', 'doctor'), p('c1', 'civilian'), p('c2', 'civilian'), p('c3', 'civilian')];

  it('keeps every Sheriff and Don check across nights', () => {
    let s = gameWith(players);
    s = reducer(s, { type: 'NIGHT_TARGET', stepId: 'sheriff', targetId: 'm1' });
    s = reducer(s, { type: 'NIGHT_TARGET', stepId: 'don', targetId: 'c1' });
    s = reducer(s, { type: 'RESOLVE_NIGHT' });
    s = reducer({ ...s, phase: 'day' }, { type: 'FINISH_VOTING' });
    s = reducer(s, { type: 'NIGHT_TARGET', stepId: 'sheriff', targetId: 'c2' });
    s = reducer(s, { type: 'NIGHT_TARGET', stepId: 'don', targetId: 'sh' });
    s = reducer(s, { type: 'RESOLVE_NIGHT' });
    expect(s.checks).toEqual([
      { round: 1, roleId: 'don', targetId: 'c1', positive: false },
      { round: 1, roleId: 'sheriff', targetId: 'm1', positive: true },
      { round: 2, roleId: 'don', targetId: 'sh', positive: true },
      { round: 2, roleId: 'sheriff', targetId: 'c2', positive: false },
    ]);
  });

  it('is cleared when a new game starts', () => {
    let s = gameWith(players);
    s = reducer(s, { type: 'NIGHT_TARGET', stepId: 'sheriff', targetId: 'm1' });
    s = reducer(s, { type: 'RESOLVE_NIGHT' });
    expect(s.checks).toHaveLength(1);
    expect(reducer(s, { type: 'START_GAME' }).checks).toEqual([]);
    expect(reducer(s, { type: 'NEW_GAME_SAME_PLAYERS' }).checks).toEqual([]);
  });
});
