import { useGame } from '../game/GameContext';
import type { CheckRecord } from '../game/types';
import { useI18n } from '../i18n/I18nContext';

interface Props {
  playerId: string;
  /** Only show checks made by this role (e.g. in that role's night step) */
  roleId?: string;
}

/**
 * Small markers for night checks on a player: 🔎 Sheriff (red = Mafia, green = not),
 * 🕶 Don (highlighted = Sheriff). One marker per checking role, latest result.
 */
export default function CheckMarks({ playerId, roleId }: Props) {
  const { state, roleById } = useGame();
  const { t, roleName } = useI18n();

  const latest = new Map<string, CheckRecord>();
  for (const c of state.checks) {
    if (c.targetId !== playerId || (roleId && c.roleId !== roleId)) continue;
    latest.set(c.roleId, c); // later checks overwrite earlier ones
  }
  if (latest.size === 0) return null;

  return (
    <span className="check-marks">
      {[...latest.values()].map((c) => {
        const role = roleById.get(c.roleId);
        const isDon = role?.nightAction === 'donCheck';
        const result = t(isDon ? (c.positive ? 'check.isSheriff' : 'check.notSheriff') : c.positive ? 'check.isMafia' : 'check.notMafia');
        const label = t('check.title', { role: roleName(role), round: c.round, result });
        return (
          <span key={c.roleId} className={`check-mark ${isDon ? 'is-don' : 'is-sheriff'} ${c.positive ? 'is-yes' : 'is-no'}`} title={label} aria-label={label}>
            <span aria-hidden>{isDon ? '🕶' : '🔎'}</span>
          </span>
        );
      })}
    </span>
  );
}
