import { useState } from 'react';
import Modal from '../components/Modal';
import Stepper from '../components/Stepper';
import { useGame } from '../game/GameContext';
import { MAX_PLAYERS, MIN_PLAYERS, rolesTotal } from '../game/reducer';
import type { NightAction, Settings, Team } from '../game/types';
import { useI18n } from '../i18n/I18nContext';

const TEAMS: Team[] = ['town', 'mafia', 'neutral'];
const ACTIONS: NightAction[] = ['none', 'kill', 'heal', 'check'];
const TIMER_LABELS = {
  discussionSeconds: 'setup.discussion',
  speechSeconds: 'setup.speech',
  defenseSeconds: 'setup.defense',
  lastWordSeconds: 'setup.lastWord',
} as const;

export default function SetupScreen() {
  const { state, dispatch } = useGame();
  const { t, tk, roleName } = useI18n();
  const [adding, setAdding] = useState(false);
  const total = rolesTotal(state.roleCounts);
  const ok = total === state.players.length;

  const setTimer = (key: keyof Settings, value: string) => {
    const n = Math.max(5, Math.min(600, Number(value) || 0));
    dispatch({ type: 'SET_SETTINGS', settings: { [key]: n } });
  };

  return (
    <div className="screen setup">
      <section className="card">
        <h2>{t('setup.players')}</h2>
        <div className="row between">
          <span>{t('setup.playerCount')}</span>
          <Stepper
            size="lg"
            value={state.players.length}
            min={MIN_PLAYERS}
            max={MAX_PLAYERS}
            onChange={(count) => dispatch({ type: 'SET_PLAYER_COUNT', count })}
            label={t('setup.playerCount')}
          />
        </div>
        <h3>{t('setup.playerNames')}</h3>
        <ol className="name-list">
          {state.players.map((p, i) => (
            <li key={p.id}>
              <span className="seat">{i + 1}</span>
              <input
                value={p.name}
                onChange={(e) => dispatch({ type: 'SET_PLAYER_NAME', id: p.id, name: e.target.value })}
                onFocus={(e) => e.target.select()}
                maxLength={24}
                aria-label={`${t('setup.players')} ${i + 1}`}
              />
              <div className="move">
                <button className="icon-btn" onClick={() => dispatch({ type: 'MOVE_PLAYER', id: p.id, dir: -1 })} disabled={i === 0} aria-label="up">
                  ↑
                </button>
                <button className="icon-btn" onClick={() => dispatch({ type: 'MOVE_PLAYER', id: p.id, dir: 1 })} disabled={i === state.players.length - 1} aria-label="down">
                  ↓
                </button>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="card">
        <div className="row between">
          <h2>{t('setup.roles')}</h2>
          <button className="btn btn-sm" onClick={() => dispatch({ type: 'SUGGEST_ROLES' })}>
            ✨ {t('setup.suggest')}
          </button>
        </div>
        <ul className="role-list">
          {state.roles.map((r) => (
            <li key={r.id} style={{ '--role': r.color } as React.CSSProperties}>
              <span className="role-dot" />
              <div className="role-info">
                <strong>{roleName(r)}</strong>
                <small className="muted">
                  {tk(`team.${r.team}`)} · {tk(`action.${r.nightAction}`)}
                </small>
              </div>
              {r.custom && (
                <button className="icon-btn" onClick={() => dispatch({ type: 'REMOVE_ROLE', roleId: r.id })} aria-label={t('setup.remove')} title={t('setup.remove')}>
                  ✕
                </button>
              )}
              <Stepper
                value={state.roleCounts[r.id] ?? 0}
                max={state.players.length}
                onChange={(count) => dispatch({ type: 'SET_ROLE_COUNT', roleId: r.id, count })}
                label={roleName(r)}
              />
            </li>
          ))}
        </ul>
        <button className="btn btn-ghost" onClick={() => setAdding(true)}>
          + {t('setup.addRole')}
        </button>
        <p className={`total ${ok ? 'is-ok' : 'is-bad'}`}>
          {t('setup.rolesTotal', { total, players: state.players.length })}
          {!ok && <span> — {t('setup.rolesMismatch')}</span>}
        </p>
      </section>

      <div className="setup-stack">
      <section className="card">
        <h2>{t('setup.introTitle')}</h2>
        <label className="check">
          <input
            type="checkbox"
            checked={state.settings.introRound}
            onChange={(e) => dispatch({ type: 'SET_SETTINGS', settings: { introRound: e.target.checked } })}
          />
          {t('setup.introRound')}
        </label>
        <p className="muted small">{t('setup.introHint')}</p>
        {state.settings.introRound && (
          <div className="timer-settings">
            {(['introMafiaSeconds', 'introRoleSeconds'] as const).map((k) => (
              <label key={k}>
                <span>{t(k === 'introMafiaSeconds' ? 'setup.introMafia' : 'setup.introRole')}</span>
                <input type="number" min={5} max={600} step={5} value={state.settings[k]} onChange={(e) => setTimer(k, e.target.value)} />
              </label>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <h2>{t('setup.timers')}</h2>
        <div className="timer-settings">
          {(['discussionSeconds', 'speechSeconds', 'defenseSeconds', 'lastWordSeconds'] as const).map((k) => (
            <label key={k}>
              <span>{t(TIMER_LABELS[k])}</span>
              <input type="number" min={5} max={600} step={5} value={state.settings[k]} onChange={(e) => setTimer(k, e.target.value)} />
            </label>
          ))}
        </div>
        <label className="check">
          <input type="checkbox" checked={state.settings.sound} onChange={(e) => dispatch({ type: 'SET_SETTINGS', settings: { sound: e.target.checked } })} />
          {t('setup.sound')}
        </label>
        <label className="check">
          <input type="checkbox" checked={state.settings.vibrate} onChange={(e) => dispatch({ type: 'SET_SETTINGS', settings: { vibrate: e.target.checked } })} />
          {t('setup.vibrate')}
        </label>
      </section>

      </div>

      <div className="footer-bar">
        <button className="btn btn-primary btn-lg" disabled={!ok} onClick={() => dispatch({ type: 'GO_ASSIGN' })}>
          {t('setup.next')}
        </button>
      </div>

      {adding && <AddRoleModal onClose={() => setAdding(false)} />}
    </div>
  );
}

function AddRoleModal({ onClose }: { onClose: () => void }) {
  const { dispatch } = useGame();
  const { t, tk } = useI18n();
  const [name, setName] = useState('');
  const [team, setTeam] = useState<Team>('town');
  const [nightAction, setNightAction] = useState<NightAction>('none');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    dispatch({ type: 'ADD_CUSTOM_ROLE', name, team, nightAction });
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <form onSubmit={submit} className="form">
        <h2>{t('setup.addRole')}</h2>
        <label>
          <span>{t('setup.roleName')}</span>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={24} />
        </label>
        <label>
          <span>{t('setup.team')}</span>
          <select value={team} onChange={(e) => setTeam(e.target.value as Team)}>
            {TEAMS.map((x) => (
              <option key={x} value={x}>
                {tk(`team.${x}`)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{t('setup.nightAction')}</span>
          <select value={nightAction} onChange={(e) => setNightAction(e.target.value as NightAction)}>
            {ACTIONS.map((x) => (
              <option key={x} value={x}>
                {tk(`action.${x}`)}
              </option>
            ))}
          </select>
        </label>
        <div className="row end">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {t('setup.cancel')}
          </button>
          <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
            {t('setup.add')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
