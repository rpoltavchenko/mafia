import PlayerLabel from '../components/PlayerLabel';
import { playerText } from '../game/players';
import { useState } from 'react';
import PlayerTimer from '../components/PlayerTimer';
import Stepper from '../components/Stepper';
import { useGame } from '../game/GameContext';
import { effectiveVotes } from '../game/reducer';
import type { Player } from '../game/types';
import { useI18n } from '../i18n/I18nContext';

export default function VotingPanel({ onActiveChange }: { onActiveChange: (id: string | null) => void }) {
  const { state, dispatch } = useGame();
  const { t } = useI18n();
  const { vote } = state;
  const [timerIndex, setTimerIndex] = useState(0);
  const byId = (id: string) => state.players.find((p) => p.id === id);
  const alive = state.players.filter((p) => p.alive);
  const nominees = vote.nominees.map(byId).filter((p): p is Player => !!p);
  const counted = effectiveVotes(state);
  const lastId = vote.nominees[vote.nominees.length - 1];
  // Votes given to everyone except the last nominee
  const given = vote.nominees.reduce((sum, id) => (id === lastId ? sum : sum + (counted[id] ?? 0)), 0);
  const tooMany = given > alive.length;

  const toNight = (
    <button className="btn btn-primary btn-lg" onClick={() => dispatch({ type: 'FINISH_VOTING' })}>
      🌙 {t('vote.toNight')}
    </button>
  );

  return (
    <div className="card voting-panel">
      <h3>{t('vote.title')}</h3>

      {vote.stage === 'nominate' && (
        <>
          <p className="muted">{t('vote.nominate')}</p>
          <div className="player-grid">
            {alive.map((p) => {
              const on = vote.nominees.includes(p.id);
              return (
                <button key={p.id} className={`chip chip-player ${on ? 'is-selected' : ''}`} onClick={() => dispatch({ type: 'TOGGLE_NOMINEE', id: p.id })} aria-pressed={on}>
                  <PlayerLabel id={p.id} />
                </button>
              );
            })}
          </div>
          {nominees.length > 0 && (
            <p>
              {t('vote.nominees')}: <strong>{nominees.map((p) => playerText(state.players, p.id)).join(', ')}</strong>
            </p>
          )}
          <div className="panel-footer">
            <button className="btn btn-ghost" onClick={() => dispatch({ type: 'FINISH_VOTING' })}>
              {t('vote.skip')}
            </button>
            <button className="btn btn-primary btn-lg" disabled={nominees.length === 0} onClick={() => dispatch({ type: 'START_VOTE' })}>
              {t('vote.start')}
            </button>
          </div>
        </>
      )}

      {(vote.stage === 'vote' || vote.stage === 'revote') && (
        <>
          {vote.stage === 'revote' && <p className="tag">{t('vote.revote')}</p>}
          <p className="muted">{t('vote.allVote', { alive: alive.length })}</p>
          <ul className="vote-list">
            {nominees.map((p) => {
              const isLast = p.id === lastId;
              const value = vote.votes[p.id] ?? 0;
              return (
                <li key={p.id} className={isLast ? 'is-last' : ''}>
                  <span className="vote-name">
                    <PlayerLabel id={p.id} size="lg" />
                  </span>
                  {isLast ? (
                    <span className="vote-auto">
                      <small className="muted">{t('vote.remaining')}</small>
                      <strong>{counted[p.id] ?? 0}</strong>
                    </span>
                  ) : (
                    <Stepper
                      size="lg"
                      value={value}
                      max={value + Math.max(0, alive.length - given)}
                      onChange={(v) => dispatch({ type: 'SET_VOTES', id: p.id, votes: v })}
                      label={playerText(state.players, p.id)}
                    />
                  )}
                </li>
              );
            })}
          </ul>
          <p className={tooMany ? 'warn' : 'muted'}>
            {tooMany ? t('vote.tooMany') : t('vote.votesCast', { cast: alive.length, alive: alive.length })}
          </p>
          <div className="panel-footer">
            <button className="btn btn-primary btn-lg" disabled={tooMany} onClick={() => { setTimerIndex(0); dispatch({ type: 'RESOLVE_VOTE' }); }}>
              {t('vote.resolve')}
            </button>
          </div>
        </>
      )}

      {vote.stage === 'defense' && (
        <>
          <p className="tag is-warn">⚖️ {t('vote.defense')}</p>
          <PlayerTimer
            title={t('setup.defense')}
            queue={nominees}
            index={timerIndex}
            onIndexChange={setTimerIndex}
            seconds={state.settings.defenseSeconds}
            onActiveChange={onActiveChange}
          />
          <div className="panel-footer">
            <button className="btn btn-primary btn-lg" onClick={() => dispatch({ type: 'START_REVOTE' })}>
              {t('vote.revote')} →
            </button>
          </div>
        </>
      )}

      {vote.stage === 'tie' && (
        <>
          <p className="tag is-warn">{t('vote.tie')}</p>
          <p>
            <strong>{nominees.map((p) => playerText(state.players, p.id)).join(', ')}</strong>
          </p>
          <div className="panel-footer">
            <button className="btn" onClick={() => dispatch({ type: 'NO_ELIMINATION' })}>
              {t('vote.nobody')}
            </button>
            <button className="btn btn-danger btn-lg" onClick={() => { setTimerIndex(0); dispatch({ type: 'ELIMINATE_ALL_TIED' }); }}>
              {t('vote.eliminateAll')}
            </button>
          </div>
        </>
      )}

      {vote.stage === 'lastWord' && (
        <>
          {vote.eliminated.length === 0 ? (
            <p className="done-msg">🤝 {t('vote.noOneOut')}</p>
          ) : (
            <PlayerTimer
              title={t('vote.lastWord')}
              queue={vote.eliminated.map(byId).filter((p): p is Player => !!p)}
              index={timerIndex}
              onIndexChange={setTimerIndex}
              seconds={state.settings.lastWordSeconds}
              onActiveChange={onActiveChange}
            />
          )}
          <div className="panel-footer">{toNight}</div>
        </>
      )}
    </div>
  );
}
