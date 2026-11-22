import CheckMarks from './CheckMarks';
import Stepper from './Stepper';
import { displayName } from '../game/players';
import { useState } from 'react';
import type { Player, RoleDef } from '../game/types';
import { useI18n } from '../i18n/I18nContext';
import RoleBadge from './RoleBadge';

export type TileStatus = 'speaking' | 'next' | null;

interface Props {
  player: Player;
  seat: number;
  role: RoleDef | undefined;
  hideRoles: boolean;
  status?: TileStatus;
  onKill: () => void;
  onRevive: () => void;
  onFoul: (delta: 1 | -1) => void;
}

export default function PlayerTile({ player, seat, role, hideRoles, status = null, onKill, onRevive, onFoul }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const cls = ['tile', !player.alive && 'is-dead', status === 'speaking' && 'is-speaking', status === 'next' && 'is-next']
    .filter(Boolean)
    .join(' ');

  const label = !player.alive ? t('game.out') : status === 'speaking' ? t('game.speaking') : status === 'next' ? t('game.next') : null;

  return (
    <div className={cls} style={role && !hideRoles ? ({ '--role': role.color } as React.CSSProperties) : undefined}>
      <button
        className="tile-main"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-current={status === 'speaking' ? 'true' : undefined}
        aria-label={`#${seat} ${displayName(player, seat)}${label ? ` — ${label}` : ''}`}
      >
        <span className="tile-seat" aria-hidden>
          {seat}
        </span>
        <span className="tile-body">
          {displayName(player, seat) && <span className="tile-name">{displayName(player, seat)}</span>}
          {label && (
            <span className="tile-status">
              {status === 'speaking' && player.alive && <span aria-hidden>🎤 </span>}
              {label}
            </span>
          )}
          <span className="tile-meta">
            <RoleBadge role={role} hidden={hideRoles} />
            {!hideRoles && <CheckMarks playerId={player.id} />}
            {player.fouls > 0 && (
              <span className={`fouls ${player.fouls >= 3 ? 'is-warn' : ''}`} title={t('game.fouls', { n: player.fouls })}>
                {'●'.repeat(Math.min(player.fouls, 4))}
              </span>
            )}
          </span>
        </span>
      </button>
      {open && (
        <div className="tile-actions">
          <div className="tile-fouls">
            <span className="tile-fouls-label">{t('game.foulsShort')}</span>
            <Stepper
              value={player.fouls}
              max={9}
              onChange={(v) => v !== player.fouls && onFoul(v > player.fouls ? 1 : -1)}
              label={`${t('game.foulsShort')} — #${seat}`}
            />
          </div>
          {player.alive ? (
            <button className="btn btn-sm btn-danger tile-action-main" onClick={() => { onKill(); setOpen(false); }}>
              {t('game.kill')}
            </button>
          ) : (
            <button className="btn btn-sm tile-action-main" onClick={() => { onRevive(); setOpen(false); }}>
              {t('game.revive')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
