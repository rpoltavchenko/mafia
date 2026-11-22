import { useGame } from '../game/GameContext';
import { displayName, playerText } from '../game/players';
import { useI18n } from '../i18n/I18nContext';

export default function AssignScreen() {
  const { state, dispatch, roleById } = useGame();
  const { t, roleName } = useI18n();
  const allAssigned = state.players.every((p) => p.roleId);

  // dealt vs needed per role (setup counts)
  const dealt: Record<string, number> = {};
  for (const p of state.players) if (p.roleId) dealt[p.roleId] = (dealt[p.roleId] ?? 0) + 1;
  const summary = state.roles.filter((r) => (state.roleCounts[r.id] ?? 0) > 0 || (dealt[r.id] ?? 0) > 0);
  const unassigned = state.players.filter((p) => !p.roleId).length;

  return (
    <div className="screen assign">
      <section className="card assign-head">
        <div className="row between wrap">
          <h2>{t('assign.title')}</h2>
          <button className="btn" onClick={() => dispatch({ type: 'RANDOMIZE' })}>
            {t('assign.randomize')}
          </button>
        </div>
        <ul className="role-summary" aria-label={t('setup.roles')}>
          {summary.map((r) => {
            const have = dealt[r.id] ?? 0;
            const need = state.roleCounts[r.id] ?? 0;
            return (
              <li key={r.id} className={have === need ? '' : 'is-off'} style={{ '--role': r.color } as React.CSSProperties}>
                <span className="role-dot" aria-hidden />
                <span className="role-summary-name">{roleName(r)}</span>
                <b>
                  {have}/{need}
                </b>
              </li>
            );
          })}
          {unassigned > 0 && (
            <li className="is-off">
              <span className="role-summary-name">{t('assign.noRole')}</span>
              <b>{unassigned}</b>
            </li>
          )}
        </ul>
        <p className="muted small">{t('assign.hint')}</p>
      </section>

      <div className="assign-grid">
        {state.players.map((p, i) => {
          const seat = i + 1;
          const role = p.roleId ? roleById.get(p.roleId) : undefined;
          const name = displayName(p, seat);
          return (
            <div
              key={p.id}
              className={`assign-card ${p.locked ? 'is-locked' : ''} ${role ? '' : 'is-empty'}`}
              style={role ? ({ '--role': role.color } as React.CSSProperties) : undefined}
            >
              <span className="tile-seat" aria-hidden>
                {seat}
              </span>
              <div className="assign-card-body">
                {name && <span className="tile-name">{name}</span>}
                <label className="role-picker">
                  <span className="role-badge">{role ? roleName(role) : t('assign.noRole')}</span>
                  <span className="role-picker-caret" aria-hidden>
                    ▾
                  </span>
                  <select
                    value={p.roleId ?? ''}
                    onChange={(e) => dispatch({ type: 'SET_PLAYER_ROLE', id: p.id, roleId: e.target.value || null })}
                    aria-label={`${playerText(state.players, p.id)} — ${t('setup.roles')}`}
                  >
                    <option value="">{t('assign.noRole')}</option>
                    {state.roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {roleName(r)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {p.locked && (
                <button className="icon-btn assign-lock" onClick={() => dispatch({ type: 'TOGGLE_LOCK', id: p.id })} title={t('assign.unlock')} aria-label={`${t('assign.unlock')} — #${seat}`}>
                  🔒
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="footer-bar">
        <button className="btn btn-ghost" onClick={() => dispatch({ type: 'BACK_TO_SETUP' })}>
          {t('assign.back')}
        </button>
        <div className="row">
          <button className="btn" disabled={!allAssigned} onClick={() => dispatch({ type: 'START_REVEAL' })}>
            {t('assign.reveal')}
          </button>
          <button className="btn btn-primary" disabled={!allAssigned} onClick={() => dispatch({ type: 'START_GAME' })}>
            {t('assign.start')}
          </button>
        </div>
      </div>
    </div>
  );
}
