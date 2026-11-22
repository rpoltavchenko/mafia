import { assignRoles } from './assign';
import { playerText } from './players';
import { nightSteps, resolveNight, targetBlock } from './night';
import { BUILTIN_ROLES, CUSTOM_COLORS, suggestRoleCounts } from './roles';
import type { GameState, LogEntry, NightAction, Player, Settings, Team, VoteState } from './types';
import { checkWinner } from './winCheck';

export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 20;

let idCounter = 0;
const makeId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${(idCounter++).toString(36)}`;

function makePlayer(index: number): Player {
  return { id: makeId('p'), name: `#${index + 1}`, roleId: null, alive: true, fouls: 0, seen: false, locked: false };
}

const emptyVote = (): VoteState => ({ stage: 'nominate', nominees: [], nominatedBy: {}, votes: {}, eliminated: [] });
const emptySpeech = () => ({ queue: [] as string[], index: 0, discussionDone: false });

export const DEFAULT_SETTINGS: Settings = {
  introRound: true,
  introMafiaSeconds: 30,
  introRoleSeconds: 10,
  discussionSeconds: 60,
  speechSeconds: 60,
  defenseSeconds: 30,
  lastWordSeconds: 30,
  vibrate: true,
  sound: true,
};

export function initialState(playerCount = 10): GameState {
  return {
    version: 1,
    phase: 'setup',
    round: 0,
    players: Array.from({ length: playerCount }, (_, i) => makePlayer(i)),
    roles: BUILTIN_ROLES.map((r) => ({ ...r })),
    roleCounts: suggestRoleCounts(playerCount),
    settings: { ...DEFAULT_SETTINGS },
    night: { targets: {} },
    lastHeals: {},
    speech: emptySpeech(),
    vote: emptyVote(),
    log: [],
    winner: null,
  };
}

export type Action =
  | { type: 'SET_PLAYER_COUNT'; count: number }
  | { type: 'SET_PLAYER_NAME'; id: string; name: string }
  | { type: 'MOVE_PLAYER'; id: string; dir: -1 | 1 }
  | { type: 'SET_ROLE_COUNT'; roleId: string; count: number }
  | { type: 'SUGGEST_ROLES' }
  | { type: 'ADD_CUSTOM_ROLE'; name: string; team: Team; nightAction: NightAction }
  | { type: 'REMOVE_ROLE'; roleId: string }
  | { type: 'SET_SETTINGS'; settings: Partial<Settings> }
  | { type: 'GO_ASSIGN' }
  | { type: 'BACK_TO_SETUP' }
  | { type: 'BACK_TO_ASSIGN' }
  | { type: 'RANDOMIZE' }
  | { type: 'SET_PLAYER_ROLE'; id: string; roleId: string | null }
  | { type: 'TOGGLE_LOCK'; id: string }
  | { type: 'START_REVEAL' }
  | { type: 'MARK_SEEN'; id: string }
  | { type: 'START_GAME' }
  | { type: 'NIGHT_TARGET'; stepId: string; targetId: string | null }
  | { type: 'RESOLVE_NIGHT' }
  | { type: 'END_INTRO_NIGHT' }
  | { type: 'END_DISCUSSION' }
  | { type: 'SPEECH_SET_INDEX'; index: number }
  | { type: 'NOMINATE'; by: string; target: string | null }
  | { type: 'GO_VOTING' }
  | { type: 'TOGGLE_NOMINEE'; id: string }
  | { type: 'START_VOTE' }
  | { type: 'SET_VOTES'; id: string; votes: number }
  | { type: 'RESOLVE_VOTE' }
  | { type: 'START_REVOTE' }
  | { type: 'ELIMINATE_ALL_TIED' }
  | { type: 'NO_ELIMINATION' }
  | { type: 'FINISH_VOTING' }
  | { type: 'KILL_PLAYER'; id: string }
  | { type: 'REVIVE_PLAYER'; id: string }
  | { type: 'FOUL'; id: string; delta: 1 | -1 }
  | { type: 'END_GAME'; winner: GameState['winner'] }
  | { type: 'NEW_GAME_SAME_PLAYERS' }
  | { type: 'RESET' }
  | { type: 'LOAD'; state: GameState };

/** Number of players who vote: everyone alive. */
export function voterCount(state: GameState): number {
  return state.players.filter((p) => p.alive).length;
}

/**
 * Every alive player votes. The host enters votes for all nominees except the last;
 * the last nominee automatically receives all remaining votes.
 */
export function effectiveVotes(state: GameState): Record<string, number> {
  const { nominees, votes } = state.vote;
  const result: Record<string, number> = {};
  let given = 0;
  nominees.forEach((id, i) => {
    if (i === nominees.length - 1) return;
    const v = votes[id] ?? 0;
    result[id] = v;
    given += v;
  });
  if (nominees.length > 0) result[nominees[nominees.length - 1]] = Math.max(0, voterCount(state) - given);
  return result;
}

export function rolesTotal(counts: Record<string, number>): number {
  return Object.values(counts).reduce((a, b) => a + b, 0);
}

/** Players are always referred to number first in the log: "#5 Anna". */
function nameOf(state: GameState, id: string): string {
  return playerText(state.players, id);
}

function addLog(state: GameState, entry: Omit<LogEntry, 'round'>): LogEntry[] {
  return [...state.log, { round: state.round, ...entry }];
}

/** Round 0 is the introduction round: Night 0 (roles meet the host) and Day 0 without voting. */
export function isIntroRound(state: GameState): boolean {
  return state.round === 0;
}

/**
 * Alive players in seat order, starting from a seat that moves one place each day.
 * `dayIndex` counts days from 0 (the first day of the game, whichever round it is).
 */
export function speakingOrder(players: Player[], dayIndex: number): string[] {
  const alive = players.filter((p) => p.alive);
  if (alive.length === 0) return [];
  const offset = Math.max(0, dayIndex) % alive.length;
  return [...alive.slice(offset), ...alive.slice(0, offset)].map((p) => p.id);
}

/** Days played so far: 0 for the first day of the game. */
function dayIndex(state: GameState): number {
  return state.settings.introRound ? state.round : state.round - 1;
}

function goNight(state: GameState, round: number): GameState {
  return {
    ...state,
    phase: 'night',
    round,
    night: { targets: {} },
    vote: emptyVote(),
    speech: emptySpeech(),
  };
}

/** Moves to the end screen if someone has won; otherwise returns `next`. */
function withWinCheck(next: GameState): GameState {
  const winner = checkWinner(next.players, next.roles);
  if (!winner) return next;
  return { ...next, phase: 'ended', winner, log: [...next.log, { round: next.round, phase: 'host', key: 'log.winner', params: { team: winner } }] };
}

function eliminate(state: GameState, ids: string[]): GameState {
  const players = state.players.map((p) => (ids.includes(p.id) ? { ...p, alive: false } : p));
  let log = state.log;
  for (const id of ids) log = [...log, { round: state.round, phase: 'voting', key: 'log.votedOut', params: { name: nameOf(state, id) } }];
  return { ...state, players, log, vote: { ...state.vote, stage: 'lastWord', eliminated: ids } };
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SET_PLAYER_COUNT': {
      const count = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, action.count));
      const players = state.players.slice(0, count);
      while (players.length < count) players.push(makePlayer(players.length));
      return { ...state, players, roleCounts: suggestRoleCounts(count) };
    }
    case 'SET_PLAYER_NAME':
      return { ...state, players: state.players.map((p) => (p.id === action.id ? { ...p, name: action.name } : p)) };
    case 'MOVE_PLAYER': {
      const i = state.players.findIndex((p) => p.id === action.id);
      const j = i + action.dir;
      if (i < 0 || j < 0 || j >= state.players.length) return state;
      const players = state.players.slice();
      [players[i], players[j]] = [players[j], players[i]];
      return { ...state, players };
    }
    case 'SET_ROLE_COUNT':
      return { ...state, roleCounts: { ...state.roleCounts, [action.roleId]: Math.max(0, action.count) } };
    case 'SUGGEST_ROLES': {
      const counts = suggestRoleCounts(state.players.length);
      for (const r of state.roles) if (r.custom) counts[r.id] = 0;
      return { ...state, roleCounts: counts };
    }
    case 'ADD_CUSTOM_ROLE': {
      const name = action.name.trim();
      if (!name) return state;
      const customCount = state.roles.filter((r) => r.custom).length;
      const role = {
        id: makeId('r'),
        name,
        team: action.team,
        nightAction: action.nightAction,
        color: CUSTOM_COLORS[customCount % CUSTOM_COLORS.length],
        custom: true,
      };
      return { ...state, roles: [...state.roles, role], roleCounts: { ...state.roleCounts, [role.id]: 1 } };
    }
    case 'REMOVE_ROLE': {
      const role = state.roles.find((r) => r.id === action.roleId);
      if (!role?.custom) return state;
      const roleCounts = { ...state.roleCounts };
      delete roleCounts[action.roleId];
      return {
        ...state,
        roles: state.roles.filter((r) => r.id !== action.roleId),
        roleCounts,
        players: state.players.map((p) => (p.roleId === action.roleId ? { ...p, roleId: null, locked: false } : p)),
      };
    }
    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } };

    case 'GO_ASSIGN': {
      if (rolesTotal(state.roleCounts) !== state.players.length) return state;
      const cleared = state.players.map((p) => ({ ...p, locked: false, roleId: null }));
      return { ...state, phase: 'assign', players: assignRoles(cleared, state.roleCounts) };
    }
    case 'BACK_TO_SETUP':
      return { ...state, phase: 'setup' };
    case 'BACK_TO_ASSIGN':
      return { ...state, phase: 'assign' };
    case 'RANDOMIZE':
      return { ...state, players: assignRoles(state.players, state.roleCounts) };
    case 'SET_PLAYER_ROLE':
      return {
        ...state,
        players: state.players.map((p) => (p.id === action.id ? { ...p, roleId: action.roleId, locked: action.roleId !== null } : p)),
      };
    case 'TOGGLE_LOCK':
      return { ...state, players: state.players.map((p) => (p.id === action.id ? { ...p, locked: !p.locked } : p)) };

    case 'START_REVEAL':
      if (state.players.some((p) => !p.roleId)) return state;
      return { ...state, phase: 'reveal', players: state.players.map((p) => ({ ...p, seen: false })) };
    case 'MARK_SEEN':
      return { ...state, players: state.players.map((p) => (p.id === action.id ? { ...p, seen: true } : p)) };

    case 'START_GAME': {
      if (state.players.some((p) => !p.roleId)) return state;
      const fresh: GameState = {
        ...state,
        players: state.players.map((p) => ({ ...p, alive: true, fouls: 0 })),
        log: [],
        winner: null,
        lastHeals: {},
      };
      const firstRound = state.settings.introRound ? 0 : 1;
      return goNight({ ...fresh, round: firstRound }, firstRound);
    }

    case 'END_INTRO_NIGHT': {
      if (!isIntroRound(state) || state.phase !== 'night') return state;
      return {
        ...state,
        phase: 'day',
        log: addLog(state, { phase: 'night', key: 'log.introNight' }),
        speech: { queue: speakingOrder(state.players, 0), index: 0, discussionDone: false },
        vote: emptyVote(),
      };
    }

    case 'NIGHT_TARGET': {
      if (action.targetId) {
        const step = nightSteps(state.players, state.roles).find((s) => s.id === action.stepId);
        const target = state.players.find((p) => p.id === action.targetId);
        if (!step || !target?.alive || targetBlock(step, action.targetId, state.lastHeals)) return state; // not allowed
      }
      return { ...state, night: { targets: { ...state.night.targets, [action.stepId]: action.targetId } } };
    }
    case 'RESOLVE_NIGHT': {
      if (isIntroRound(state)) return reducer(state, { type: 'END_INTRO_NIGHT' }); // Night 0: nobody acts
      const outcome = resolveNight(state.players, state.roles, state.night.targets);
      const players = state.players.map((p) => (outcome.deaths.includes(p.id) ? { ...p, alive: false } : p));
      let log = state.log;
      const push = (key: string, params?: LogEntry['params']) => {
        log = [...log, { round: state.round, phase: 'night', key, params }];
      };
      for (const id of outcome.saved) push('log.saved', { name: nameOf(state, id) });
      for (const c of outcome.checks) {
        push(c.positive ? 'log.checkPositive' : 'log.checkNegative', { role: c.stepId, name: nameOf(state, c.targetId) });
      }
      if (outcome.deaths.length === 0) push('log.quietNight');
      for (const id of outcome.deaths) push('log.killed', { name: nameOf(state, id) });
      // remember tonight's heals: the same player can't be healed again tomorrow night
      const lastHeals: Record<string, string | null> = {};
      for (const step of nightSteps(state.players, state.roles)) {
        if (step.action === 'heal') lastHeals[step.id] = state.night.targets[step.id] ?? null;
      }
      const next: GameState = {
        ...state,
        players,
        log,
        lastHeals,
        phase: 'day',
        speech: { queue: speakingOrder(players, dayIndex(state)), index: 0, discussionDone: false },
        vote: emptyVote(),
      };
      return withWinCheck(next);
    }

    case 'END_DISCUSSION':
      return { ...state, speech: { ...state.speech, discussionDone: true } };
    case 'NOMINATE': {
      // One nomination per speaker: replace whatever this speaker nominated before
      let nominees = state.vote.nominees;
      const nominatedBy = { ...state.vote.nominatedBy };
      const previous = Object.keys(nominatedBy).find((id) => nominatedBy[id] === action.by);
      if (previous) {
        nominees = nominees.filter((id) => id !== previous);
        delete nominatedBy[previous];
      }
      if (action.target && action.target !== previous && !nominees.includes(action.target)) {
        nominees = [...nominees, action.target];
        nominatedBy[action.target] = action.by;
      }
      return { ...state, vote: { ...state.vote, nominees, nominatedBy } };
    }
    case 'SPEECH_SET_INDEX':
      return { ...state, speech: { ...state.speech, index: Math.max(0, Math.min(action.index, state.speech.queue.length)) } };

    case 'GO_VOTING': {
      if (isIntroRound(state)) return state; // Day 0 has no voting
      // Keep nominations made during the day (only alive players can be on the ballot)
      const alive = new Set(state.players.filter((p) => p.alive).map((p) => p.id));
      const nominees = state.vote.nominees.filter((id) => alive.has(id));
      return { ...state, phase: 'voting', vote: { ...emptyVote(), nominees, nominatedBy: state.vote.nominatedBy } };
    }
    case 'TOGGLE_NOMINEE': {
      if (state.vote.stage !== 'nominate') return state;
      const has = state.vote.nominees.includes(action.id);
      const nominees = has ? state.vote.nominees.filter((id) => id !== action.id) : [...state.vote.nominees, action.id];
      const nominatedBy = { ...state.vote.nominatedBy };
      if (has) delete nominatedBy[action.id];
      return { ...state, vote: { ...state.vote, nominees, nominatedBy } };
    }
    case 'START_VOTE':
      if (state.vote.nominees.length === 0) return state;
      return { ...state, vote: { ...state.vote, stage: 'vote', votes: {} } };
    case 'SET_VOTES':
      return { ...state, vote: { ...state.vote, votes: { ...state.vote.votes, [action.id]: Math.max(0, action.votes) } } };
    case 'RESOLVE_VOTE': {
      const { nominees, stage } = state.vote;
      const votes = effectiveVotes(state);
      const max = Math.max(0, ...nominees.map((id) => votes[id] ?? 0));
      if (max === 0) {
        return { ...state, log: addLog(state, { phase: 'voting', key: 'log.noElimination' }), vote: { ...state.vote, stage: 'lastWord', eliminated: [] } };
      }
      const top = nominees.filter((id) => (votes[id] ?? 0) === max);
      if (top.length === 1) return eliminate(state, top);
      if (stage === 'vote') {
        return {
          ...state,
          log: addLog(state, { phase: 'voting', key: 'log.tie', params: { names: top.map((id) => nameOf(state, id)).join(', ') } }),
          vote: { ...state.vote, stage: 'defense', nominees: top, votes: {} },
        };
      }
      return { ...state, vote: { ...state.vote, stage: 'tie', nominees: top } };
    }
    case 'START_REVOTE':
      return { ...state, vote: { ...state.vote, stage: 'revote', votes: {} } };
    case 'ELIMINATE_ALL_TIED':
      return eliminate(state, state.vote.nominees);
    case 'NO_ELIMINATION':
      return { ...state, log: addLog(state, { phase: 'voting', key: 'log.noElimination' }), vote: { ...state.vote, stage: 'lastWord', eliminated: [] } };
    case 'FINISH_VOTING': {
      const next = goNight(state, state.round + 1);
      return withWinCheck(next);
    }

    case 'KILL_PLAYER':
    case 'REVIVE_PLAYER': {
      const alive = action.type === 'REVIVE_PLAYER';
      return {
        ...state,
        players: state.players.map((p) => (p.id === action.id ? { ...p, alive } : p)),
        log: addLog(state, { phase: 'host', key: alive ? 'log.revived' : 'log.removed', params: { name: nameOf(state, action.id) } }),
      };
    }
    case 'FOUL':
      return {
        ...state,
        players: state.players.map((p) => (p.id === action.id ? { ...p, fouls: Math.max(0, p.fouls + action.delta) } : p)),
      };

    case 'END_GAME':
      return {
        ...state,
        phase: 'ended',
        winner: action.winner,
        log: action.winner ? addLog(state, { phase: 'host', key: 'log.winner', params: { team: action.winner } }) : state.log,
      };
    case 'NEW_GAME_SAME_PLAYERS': {
      const players = state.players.map((p) => ({ ...p, alive: true, fouls: 0, seen: false, locked: false, roleId: null }));
      return {
        ...state,
        phase: 'assign',
        round: 0,
        players: assignRoles(players, state.roleCounts),
        log: [],
        winner: null,
        night: { targets: {} },
        lastHeals: {},
        speech: emptySpeech(),
        vote: emptyVote(),
      };
    }
    case 'RESET': {
      const fresh = initialState(state.players.length);
      return { ...fresh, settings: state.settings };
    }
    case 'LOAD':
      return action.state;
  }
}
