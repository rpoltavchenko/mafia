import { useCallback, useState } from 'react';
import HostLineCard from '../components/HostLineCard';
import PhaseCurtain from '../components/PhaseCurtain';
import LogView from '../components/LogView';
import PlayerTile from '../components/PlayerTile';
import { useGame } from '../game/GameContext';
import { checkWinner } from '../game/winCheck';
import { useI18n } from '../i18n/I18nContext';
import DayPanel from './DayPanel';
import IntroNightPanel from './IntroNightPanel';
import NightPanel from './NightPanel';
import VotingPanel from './VotingPanel';

export default function GameScreen() {
  const { state, dispatch, roleById } = useGame();
  const { t, tk } = useI18n();
  const [hideRoles, setHideRoles] = useState(false);
  const [activeId, setActiveIdState] = useState<string | null>(null);
  const setActiveId = useCallback((id: string | null) => setActiveIdState(id), []);

  const alive = state.players.filter((p) => p.alive).length;

  // Who is speaking and who is next (next is known for day speeches)
  const speakingId = state.phase !== 'night' ? activeId : null;
  const nextId = (() => {
    if (state.phase !== 'day' || !state.speech.discussionDone || !speakingId) return null;
    const queue = state.speech.queue.filter((id) => state.players.find((p) => p.id === id)?.alive);
    const i = queue.indexOf(speakingId);
    return i >= 0 ? queue[i + 1] ?? null : null;
  })();
  const pendingWinner = checkWinner(state.players, state.roles);
  const phaseIcon = state.phase === 'night' ? '🌙' : state.phase === 'day' ? '☀️' : '🗳️';

  return (
    <div className={`screen game phase-${state.phase}`}>
      <PhaseCurtain />
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
        <div className="row game-actions">
          <button
            className="btn btn-sm"
            onClick={() => setHideRoles((h) => !h)}
            aria-pressed={hideRoles}
            aria-label={hideRoles ? t('game.showRoles') : t('game.hideRoles')}
            title={hideRoles ? t('game.showRoles') : t('game.hideRoles')}
          >
            <span aria-hidden>{hideRoles ? '👁' : '🙈'}</span>
            <span className="btn-label">{hideRoles ? t('game.showRoles') : t('game.hideRoles')}</span>
          </button>
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => dispatch({ type: 'END_GAME', winner: null })}
            aria-label={t('game.endNoWinner')}
            title={t('game.endNoWinner')}
          >
            <span aria-hidden>🏁</span>
            <span className="btn-label">{t('game.endNoWinner')}</span>
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
          {state.phase === 'night' && (state.round === 0 ? <IntroNightPanel hideRoles={hideRoles} /> : <NightPanel hideRoles={hideRoles} />)}
          {state.phase === 'day' && <DayPanel onActiveChange={setActiveId} />}
          {state.phase === 'voting' && <VotingPanel onActiveChange={setActiveId} />}
        </div>

        <aside className="game-side">
          <HostLineCard />
          <div className={`tiles ${speakingId ? 'has-speaker' : ''}`}>
            {state.players.map((p, i) => (
              <PlayerTile
                key={p.id}
                player={p}
                seat={i + 1}
                role={p.roleId ? roleById.get(p.roleId) : undefined}
                hideRoles={hideRoles}
                status={p.id === speakingId ? 'speaking' : p.id === nextId ? 'next' : null}
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
