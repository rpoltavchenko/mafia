import { useState } from 'react';
import type { Player, RoleDef } from '../game/types';
import { useI18n } from '../i18n/I18nContext';
import RoleBadge from './RoleBadge';

interface Props {
  player: Player;
  seat: number;
  role: RoleDef | undefined;
  hideRoles: boolean;
  active?: boolean;
  onKill: () => void;
  onRevive: () => void;
  onFoul: (delta: 1 | -1) => void;
}

export default function PlayerTile({ player, seat, role, hideRoles, active, onKill, onRevive, onFoul }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const cls = ['tile', !player.alive && 'is-dead', active && 'is-active', role && !hideRoles && `team-${role.team}`].filter(Boolean).join(' ');

  return (
    <div className={cls} style={role && !hideRoles ? ({ '--role': role.color } as React.CSSProperties) : undefined}>
      <button className="tile-main" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="seat">{seat}</span>
        <span className="tile-name">{player.name}</span>
        <RoleBadge role={role} hidden={hideRoles} />
        {player.fouls > 0 && (
          <span className={`fouls ${player.fouls >= 3 ? 'is-warn' : ''}`} title={t('game.fouls', { n: player.fouls })}>
            {'●'.repeat(Math.min(player.fouls, 4))}
          </span>
        )}
        {active && <span className="speaking-dot" aria-label={t('game.speaking')} />}
      </button>
      {open && (
        <div className="tile-actions">
          <button className="btn btn-sm" onClick={() => onFoul(1)}>
            +{t('game.foul')}
          </button>
          <button className="btn btn-sm" onClick={() => onFoul(-1)} disabled={player.fouls === 0}>
            −{t('game.foul')}
          </button>
          {player.alive ? (
            <button className="btn btn-sm btn-danger" onClick={() => { onKill(); setOpen(false); }}>
              {t('game.kill')}
            </button>
          ) : (
            <button className="btn btn-sm" onClick={() => { onRevive(); setOpen(false); }}>
              {t('game.revive')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
