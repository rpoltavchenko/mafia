import RoleBadge from '../components/RoleBadge';
import { useGame } from '../game/GameContext';
import { useI18n } from '../i18n/I18nContext';

export default function AssignScreen() {
  const { state, dispatch, roleById } = useGame();
  const { t, roleName } = useI18n();
  const allAssigned = state.players.every((p) => p.roleId);

  // Compare the actual distribution with what setup asked for
  const actual: Record<string, number> = {};
  for (const p of state.players) if (p.roleId) actual[p.roleId] = (actual[p.roleId] ?? 0) + 1;
  const diffs = state.roles
    .filter((r) => (actual[r.id] ?? 0) !== (state.roleCounts[r.id] ?? 0))
    .map((r) => `${roleName(r)} ${actual[r.id] ?? 0}/${state.roleCounts[r.id] ?? 0}`);

  return (
    <div className="screen assign">
      <section className="card">
        <div className="row between wrap">
          <h2>{t('assign.title')}</h2>
          <button className="btn" onClick={() => dispatch({ type: 'RANDOMIZE' })}>
            {t('assign.randomize')}
          </button>
        </div>
        <p className="muted">{t('assign.hint')}</p>
        {diffs.length > 0 && <p className="warn">⚠️ {t('assign.countWarning', { details: diffs.join(', ') })}</p>}
        <ul className="assign-list">
          {state.players.map((p, i) => {
            const role = p.roleId ? roleById.get(p.roleId) : undefined;
            return (
              <li key={p.id} style={role ? ({ '--role': role.color } as React.CSSProperties) : undefined}>
                <span className="seat">{i + 1}</span>
                <span className="assign-name">{p.name}</span>
                <RoleBadge role={role} />
                <select
                  value={p.roleId ?? ''}
                  onChange={(e) => dispatch({ type: 'SET_PLAYER_ROLE', id: p.id, roleId: e.target.value || null })}
                  aria-label={`${p.name}`}
                >
                  <option value="">{t('assign.noRole')}</option>
                  {state.roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {roleName(r)}
                    </option>
                  ))}
                </select>
                <button
                  className={`icon-btn lock ${p.locked ? 'is-on' : ''}`}
                  onClick={() => dispatch({ type: 'TOGGLE_LOCK', id: p.id })}
                  title={p.locked ? t('assign.unlock') : t('assign.lock')}
                  aria-pressed={p.locked}
                  disabled={!p.roleId}
                >
                  {p.locked ? '🔒' : '🔓'}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
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
