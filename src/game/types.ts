export type Team = 'mafia' | 'town' | 'neutral';

/**
 * kill     – chooses a victim (Mafia team shares one kill; Maniac kills alone)
 * heal     – protects a player from being killed this night
 * check    – learns whether the target is on the Mafia team
 * donCheck – learns whether the target is the Sheriff
 * none     – no night action
 */
export type NightAction = 'kill' | 'heal' | 'check' | 'donCheck' | 'none';

export interface RoleDef {
  id: string;
  /** Custom roles carry a literal name; built-ins are translated via `role.<id>` */
  name?: string;
  team: Team;
  nightAction: NightAction;
  color: string;
  custom?: boolean;
}

export interface Player {
  id: string;
  name: string;
  roleId: string | null;
  alive: boolean;
  fouls: number;
  seen: boolean;
  locked: boolean;
}

export type Phase = 'setup' | 'assign' | 'reveal' | 'night' | 'day' | 'voting' | 'ended';

export interface LogEntry {
  round: number;
  phase: 'night' | 'day' | 'voting' | 'host';
  /** i18n key, e.g. `log.killed` */
  key: string;
  params?: Record<string, string | number>;
}

export interface Settings {
  discussionSeconds: number;
  speechSeconds: number;
  defenseSeconds: number;
  lastWordSeconds: number;
  vibrate: boolean;
  sound: boolean;
}

export interface NightState {
  /** stepId -> target player id */
  targets: Record<string, string | null>;
}

export interface SpeechState {
  queue: string[];
  index: number;
  /** The day opens with a free discussion before individual speeches */
  discussionDone: boolean;
}

export type VoteStage = 'nominate' | 'vote' | 'defense' | 'revote' | 'tie' | 'lastWord';

export interface VoteState {
  stage: VoteStage;
  /** In nomination order – the last nominee receives all votes not cast for others */
  nominees: string[];
  /** nominee id -> id of the player who nominated them */
  nominatedBy: Record<string, string>;
  votes: Record<string, number>;
  eliminated: string[];
}

export type Winner = 'mafia' | 'town' | 'neutral';

export interface GameState {
  version: 1;
  phase: Phase;
  round: number;
  players: Player[];
  roles: RoleDef[];
  roleCounts: Record<string, number>;
  settings: Settings;
  night: NightState;
  speech: SpeechState;
  vote: VoteState;
  log: LogEntry[];
  winner: Winner | null;
}
