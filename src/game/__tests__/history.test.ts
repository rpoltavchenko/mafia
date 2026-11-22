import { describe, expect, it } from 'vitest';
import { historyReducer, initialHistory, UNDO_LIMIT, type History, type HistoryAction } from '../history';
import { initialState } from '../reducer';
import { gameWith, p } from './helpers';

const run = (h: History, ...actions: HistoryAction[]) => actions.reduce(historyReducer, h);

const players = () => [p('m1', 'mafia'), p('s', 'sheriff'), p('d', 'doctor'), p('c1', 'civilian'), p('c2', 'civilian'), p('c3', 'civilian')];

describe('undo', () => {
  it('takes back the last game action', () => {
    const start = initialHistory(gameWith(players()));
    const h = run(start, { type: 'NIGHT_TARGET', stepId: 'mafia', targetId: 'c1' }, { type: 'RESOLVE_NIGHT' });
    expect(h.present.phase).toBe('day');
    expect(h.present.players.find((x) => x.id === 'c1')!.alive).toBe(false);

    const back = run(h, { type: 'UNDO' });
    expect(back.present.phase).toBe('night');
    expect(back.present.players.find((x) => x.id === 'c1')!.alive).toBe(true);
    expect(back.present.night.targets.mafia).toBe('c1');
    expect(back.restored).toBe(true);

    expect(run(back, { type: 'UNDO' }).present).toBe(start.present);
  });

  it('does nothing when there is nothing to undo', () => {
    const h = initialHistory(gameWith(players()));
    expect(run(h, { type: 'UNDO' })).toBe(h);
  });

  it('undoes host removals and fouls', () => {
    const h = run(initialHistory(gameWith(players())), { type: 'FOUL', id: 'c2', delta: 1 }, { type: 'KILL_PLAYER', id: 'c3' });
    const back = run(h, { type: 'UNDO' });
    expect(back.present.players.find((x) => x.id === 'c3')!.alive).toBe(true);
    expect(back.present.log).toHaveLength(0);
    expect(run(back, { type: 'UNDO' }).present.players.find((x) => x.id === 'c2')!.fouls).toBe(0);
  });

  it('undoes the end of the game, including an automatic win', () => {
    const two = [p('m1', 'mafia'), p('c1', 'civilian'), p('c2', 'civilian')];
    const h = run(initialHistory(gameWith(two)), { type: 'KILL_PLAYER', id: 'c1' });
    // Mafia now equals the rest; ending the game is one more action
    const ended = run(h, { type: 'END_GAME', winner: 'mafia' });
    expect(ended.present.phase).toBe('ended');
    const back = run(ended, { type: 'UNDO' });
    expect(back.present.phase).toBe('night');
    expect(back.present.winner).toBeNull();
  });

  it('counts repeated taps on one vote stepper as one action', () => {
    let s = gameWith(players());
    s = { ...s, phase: 'voting', vote: { ...s.vote, stage: 'vote', nominees: ['c1', 'c2'] } };
    const h = run(
      initialHistory(s),
      { type: 'SET_VOTES', id: 'c1', votes: 1 },
      { type: 'SET_VOTES', id: 'c1', votes: 2 },
      { type: 'SET_VOTES', id: 'c1', votes: 3 },
    );
    expect(h.past).toHaveLength(1);
    expect(run(h, { type: 'UNDO' }).present.vote.votes.c1).toBeUndefined();
  });

  it('does not record setup, assignment or reveal, and starts fresh with the game', () => {
    let h = initialHistory(initialState(6));
    h = run(h, { type: 'SET_PLAYER_NAME', id: h.present.players[0].id, name: 'Anna' }, { type: 'GO_ASSIGN' }, { type: 'START_GAME' });
    expect(h.present.phase).toBe('night');
    expect(h.past).toHaveLength(0);
  });

  it('forgets history on reset and new game', () => {
    const h = run(initialHistory(gameWith(players())), { type: 'FOUL', id: 'c2', delta: 1 });
    expect(run(h, { type: 'RESET' }).past).toHaveLength(0);
    const ended = run(h, { type: 'END_GAME', winner: null });
    expect(run(ended, { type: 'NEW_GAME_SAME_PLAYERS' }).past).toHaveLength(0);
  });

  it(`keeps at most ${UNDO_LIMIT} steps`, () => {
    let h = initialHistory(gameWith(players()));
    for (let i = 0; i < UNDO_LIMIT + 5; i++) h = run(h, { type: 'FOUL', id: 'c1', delta: 1 });
    expect(h.past).toHaveLength(UNDO_LIMIT);
  });

  it('ignores actions that change nothing', () => {
    const h = initialHistory(gameWith(players()));
    // fouls never go below zero
    expect(run(h, { type: 'FOUL', id: 'c1', delta: -1 })).toBe(h);
  });
});
