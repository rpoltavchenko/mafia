import { useCallback, useState } from 'react';
import LogView from '../components/LogView';
import PlayerTile from '../components/PlayerTile';
import { useGame } from '../game/GameContext';
import { checkWinner } from '../game/winCheck';
import { useI18n } from '../i18n/I18nContext';
import DayPanel from './DayPanel';
import NightPanel from './NightPanel';
import VotingPanel from './VotingPanel';

export default function GameScreen() {
  const { state, dispatch, roleById } = useGame();
  const { t, tk } = useI18n();
  const [hideRoles, setHideRoles] = useState(false);
  const [activeId, setActiveIdState] = useState<string | null>(null);
  const setActiveId = useCallback((id: string | null) => setActiveIdState(id), []);

  const alive = state.players.filter((p) => p.alive).length;
  const pendingWinner = checkWinner(state.players, state.roles);
  const phaseIcon = state.phase === 'night' ? '🌙' : state.phase === 'day' ? '☀️' : '🗳️';

  return (
    <div className={`screen game phase-${state.phase}`}>
      <div className="game-header">
        <div className="game-title">
          <span className="phase-icon" aria-hidden>
            {phaseIcon}
          </span>
          <div>
            <h2>{tk(`phase.${state.phase}`)}</h2>
            <span className="muted">
              {t('game.round', { round: state.round })} · {t('game.alive', { alive })}
            </span>
          </div>
        </div>
        <div className="row wrap">
          <button className="btn btn-sm" onClick={() => setHideRoles((h) => !h)} aria-pressed={hideRoles}>
            {hideRoles ? `👁 ${t('game.showRoles')}` : `🙈 ${t('game.hideRoles')}`}
          </button>
          <button className="btn btn-sm btn-ghost" onClick={() => dispatch({ type: 'END_GAME', winner: null })}>
            {t('game.endNoWinner')}
          </button>
        </div>
      </div>

      {pendingWinner && (
        <div className="banner">
          <span>🏁 {t('game.winnerBanner', { team: tk(`team.${pendingWinner}`) })}</span>
          <button className="btn btn-sm btn-primary" onClick={() => dispatch({ type: 'END_GAME', winner: pendingWinner })}>
            {t('game.endGame')}
          </button>
        </div>
      )}

      <div className="game-layout">
        <div className="game-panel">
          {state.phase === 'night' && <NightPanel hideRoles={hideRoles} />}
          {state.phase === 'day' && <DayPanel onActiveChange={setActiveId} />}
          {state.phase === 'voting' && <VotingPanel onActiveChange={setActiveId} />}
        </div>

        <aside className="game-side">
          <div className="tiles">
            {state.players.map((p, i) => (
              <PlayerTile
                key={p.id}
                player={p}
                seat={i + 1}
                role={p.roleId ? roleById.get(p.roleId) : undefined}
                hideRoles={hideRoles}
                active={state.phase !== 'night' && activeId === p.id}
                onKill={() => dispatch({ type: 'KILL_PLAYER', id: p.id })}
                onRevive={() => dispatch({ type: 'REVIVE_PLAYER', id: p.id })}
                onFoul={(delta) => dispatch({ type: 'FOUL', id: p.id, delta })}
              />
            ))}
          </div>
          <details className="card log-card" open={!hideRoles}>
            <summary>{t('game.log')}</summary>
            {hideRoles ? null : <LogView entries={state.log} />}
          </details>
        </aside>
      </div>
    </div>
  );
}
