import type { Player, RoleDef, Winner } from './types';

export function checkWinner(players: Player[], roles: RoleDef[]): Winner | null {
  const roleById = new Map(roles.map((r) => [r.id, r]));
  const alive = players.filter((p) => p.alive && p.roleId);
  if (alive.length === 0) return null;

  let mafia = 0;
  let neutralKillers = 0;
  for (const p of alive) {
    const role = roleById.get(p.roleId!);
    if (!role) continue;
    if (role.team === 'mafia') mafia++;
    else if (role.team === 'neutral' && role.nightAction === 'kill') neutralKillers++;
  }
  const total = alive.length;

  if (mafia === 0 && neutralKillers === 0) return 'town';
  if (neutralKillers === 0 && mafia >= total - mafia) return 'mafia';
  if (mafia === 0 && neutralKillers >= total - neutralKillers) return 'neutral';
  return null;
}
