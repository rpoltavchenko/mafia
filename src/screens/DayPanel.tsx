import { playerText, seatOf } from '../game/players';
import PlayerLabel from '../components/PlayerLabel';
import DiscussionTimer from '../components/DiscussionTimer';
import PlayerTimer from '../components/PlayerTimer';
import { useGame } from '../game/GameContext';
import type { Player } from '../game/types';
import { useI18n } from '../i18n/I18nContext';

export default function DayPanel({ onActiveChange }: { onActiveChange: (id: string | null) => void }) {
  const { state, dispatch } = useGame();
  const { t } = useI18n();
  const { vote } = state;
  const byId = (id: string) => state.players.find((p) => p.id === id);
  const alive = state.players.filter((p) => p.alive);
  const queue = state.speech.queue.map(byId).filter((p): p is Player => !!p && p.alive);
  const dayZero = state.round === 0; // introduction day: speeches only, no voting
  const nightNews = state.log.filter((l) => l.round === state.round && l.phase === 'night' && (l.key === 'log.killed' || l.key === 'log.quietNight'));

  const nominationsFor = (speaker: Player) => {
    const mine = Object.keys(vote.nominatedBy).find((id) => vote.nominatedBy[id] === speaker.id) ?? null;
    return (
      <div className="nominate-box">
        <p className="nominate-title">
          🗳️ {t('day.nominates', { name: playerText(state.players, speaker.id) })}
        </p>
        <div className="player-grid">
          {alive
            .filter((p) => p.id !== speaker.id)
            .map((p) => {
              const takenByOther = vote.nominees.includes(p.id) && p.id !== mine;
              return (
                <button
                  key={p.id}
                  className={`chip chip-player ${mine === p.id ? 'is-selected' : ''}`}
                  disabled={takenByOther}
                  title={takenByOther ? t('day.alreadyNominated') : undefined}
                  onClick={() => dispatch({ type: 'NOMINATE', by: speaker.id, target: mine === p.id ? null : p.id })}
                  aria-pressed={mine === p.id}
                >
                  <PlayerLabel id={p.id} />
                </button>
              );
            })}
        </div>
      </div>
    );
  };

  return (
    <div className="card day-panel">
      <h3>{t('day.title', { round: state.round })}</h3>
      {nightNews.length > 0 && (
        <ul className="news">
          {nightNews.map((l, i) => (
            <li key={i}>🌙 {t(l.key as 'log.killed', l.params)}</li>
          ))}
        </ul>
      )}

      {!state.speech.discussionDone ? (
        <>
          <p className="muted">{t('day.discussionHint')}</p>
          <DiscussionTimer
            title={t('day.discussion')}
            seconds={state.settings.discussionSeconds}
            onDone={() => dispatch({ type: 'END_DISCUSSION' })}
            doneLabel={t('day.startSpeeches')}
          />
        </>
      ) : (
        <>
          <p className="muted">{dayZero ? t('day.zeroHint') : t('day.hint')}</p>
          <PlayerTimer
            title={t('setup.speech')}
            queue={queue}
            index={Math.min(state.speech.index, queue.length)}
            onIndexChange={(index) => dispatch({ type: 'SPEECH_SET_INDEX', index })}
            seconds={state.settings.speechSeconds}
            onActiveChange={onActiveChange}
            renderSpeakerExtras={dayZero ? undefined : nominationsFor}
            done={<p className="done-msg">✅ {t('day.allSpoke')}</p>}
          />
        </>
      )}

      {!dayZero && (
      <div className="nominee-summary">
        <strong>{t('vote.nominees')}:</strong>
        <div className="nominee-pills">
        {vote.nominees.length === 0 ? (
          <span className="muted">{t('day.noNominees')}</span>
        ) : (
          vote.nominees.map((id, i) => {
            const by = vote.nominatedBy[id];
            return (
              <span key={id} className="nominee-pill" title={`${i + 1}`}>
                <PlayerLabel id={id} />
                {by && <small className="muted">← #{seatOf(state.players, by)}</small>}
              </span>
            );
          })
        )}
        </div>
      </div>
      )}

      <div className="panel-footer">
        {dayZero ? (
          <button className="btn btn-primary btn-lg" onClick={() => dispatch({ type: 'FINISH_VOTING' })}>
            🌙 {t('day.toNight1')}
          </button>
        ) : (
          <button className="btn btn-primary btn-lg" onClick={() => dispatch({ type: 'GO_VOTING' })}>
            🗳️ {t('day.toVoting')}
          </button>
        )}
      </div>
    </div>
  );
}
