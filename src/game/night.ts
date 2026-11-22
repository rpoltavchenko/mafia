import { NIGHT_ORDER } from './roles';
import type { NightAction, Player, RoleDef } from './types';

export interface NightStep {
  /** 'mafia' for the shared Mafia-team kill, otherwise a role id */
  id: string;
  roleId: string;
  action: Exclude<NightAction, 'none'>;
  /** Players who act in this step */
  actors: string[];
}

/** Steps for the current night, based on who is alive. */
export function nightSteps(players: Player[], roles: RoleDef[]): NightStep[] {
  const roleById = new Map(roles.map((r) => [r.id, r]));
  const alive = players.filter((p) => p.alive && p.roleId);
  const steps: NightStep[] = [];

  const mafiaTeam = alive.filter((p) => roleById.get(p.roleId!)?.team === 'mafia');
  if (mafiaTeam.length > 0) {
    steps.push({ id: 'mafia', roleId: 'mafia', action: 'kill', actors: mafiaTeam.map((p) => p.id) });
  }

  const orderIndex = (id: string) => {
    const i = NIGHT_ORDER.indexOf(id);
    return i === -1 ? NIGHT_ORDER.length : i;
  };
  const roleIds = [...new Set(alive.map((p) => p.roleId!))].sort((a, b) => orderIndex(a) - orderIndex(b));

  for (const roleId of roleIds) {
    const role = roleById.get(roleId);
    if (!role || role.nightAction === 'none') continue;
    // Mafia-team killers are covered by the shared 'mafia' step
    if (role.team === 'mafia' && role.nightAction === 'kill') continue;
    steps.push({
      id: roleId,
      roleId,
      action: role.nightAction,
      actors: alive.filter((p) => p.roleId === roleId).map((p) => p.id),
    });
  }
  return steps;
}

/** Why a player can't be chosen in a night step (an i18n key), or null if allowed. */
export type TargetBlock = 'night.blockOwnTeam' | 'night.blockSelf' | 'night.blockHealedLastNight';

/**
 * Night target rules:
 * - the Mafia team can't target its own members (themselves or the Don)
 * - checkers (Sheriff, Don) and other killers (Maniac) can't choose themselves
 * - healers (Doctor) may heal themselves, but not the same player two nights in a row
 */
export function targetBlock(step: NightStep, targetId: string, lastHeals: Record<string, string | null> = {}): TargetBlock | null {
  if (step.action === 'heal') return lastHeals[step.id] === targetId ? 'night.blockHealedLastNight' : null;
  if (step.actors.includes(targetId)) return step.id === 'mafia' ? 'night.blockOwnTeam' : 'night.blockSelf';
  return null;
}

export interface NightOutcome {
  deaths: string[];
  saved: string[];
  checks: { stepId: string; targetId: string; positive: boolean }[];
}

export function resolveNight(
  players: Player[],
  roles: RoleDef[],
  targets: Record<string, string | null>,
): NightOutcome {
  const steps = nightSteps(players, roles);
  const roleById = new Map(roles.map((r) => [r.id, r]));
  const playerById = new Map(players.map((p) => [p.id, p]));

  const killTargets = new Set<string>();
  const healTargets = new Set<string>();
  const checks: NightOutcome['checks'] = [];

  for (const step of steps) {
    const target = targets[step.id];
    if (!target) continue;
    if (step.action === 'kill') killTargets.add(target);
    else if (step.action === 'heal') healTargets.add(target);
    else checks.push({ stepId: step.id, targetId: target, positive: checkResult(step.action, playerById.get(target), roleById) });
  }

  const deaths = [...killTargets].filter((id) => !healTargets.has(id));
  const saved = [...killTargets].filter((id) => healTargets.has(id));
  return { deaths, saved, checks };
}

export function checkResult(
  action: 'check' | 'donCheck',
  target: Player | undefined,
  roleById: Map<string, RoleDef>,
): boolean {
  if (!target?.roleId) return false;
  if (action === 'donCheck') return target.roleId === 'sheriff';
  return roleById.get(target.roleId)?.team === 'mafia';
}
