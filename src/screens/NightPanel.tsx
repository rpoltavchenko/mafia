import { useGame } from '../game/GameContext';
import { checkResult, nightSteps } from '../game/night';
import { useI18n } from '../i18n/I18nContext';

export default function NightPanel({ hideRoles }: { hideRoles: boolean }) {
  const { state, dispatch, roleById } = useGame();
  const { t, tk, roleName } = useI18n();
  const steps = nightSteps(state.players, state.roles);
  const alive = state.players.filter((p) => p.alive);
  const nameOf = (id: string) => state.players.find((p) => p.id === id)?.name ?? '?';

  return (
    <div className="card night-panel">
      <h3>{t('night.title', { round: state.round })}</h3>
      <p className="muted">{t('night.hint')}</p>

      <ol className="night-steps">
        {steps.map((step, i) => {
          const role = roleById.get(step.roleId);
          const target = state.night.targets[step.id] ?? null;
          const targetPlayer = target ? state.players.find((p) => p.id === target) : undefined;
          const isCheck = step.action === 'check' || step.action === 'donCheck';
          const positive = isCheck && targetPlayer ? checkResult(step.action as 'check' | 'donCheck', targetPlayer, roleById) : null;
          const label = step.id === 'mafia' ? tk('role.mafia') : roleName(role);

          return (
            <li key={step.id} className={`night-step ${target ? 'is-done' : ''}`} style={{ '--role': role?.color } as React.CSSProperties}>
              <div className="night-step-head">
                <span className="step-num">{i + 1}</span>
                <div>
                  <strong>{label}</strong>
                  <small className="muted">
                    {' '}
                    · {tk(`action.${step.action}`)}
                    {!hideRoles && <> · {step.actors.map(nameOf).join(', ')}</>}
                  </small>
                </div>
                {positive !== null && (
                  <span className={`check-result ${positive ? 'is-yes' : 'is-no'}`}>
                    {t(step.action === 'donCheck' ? 'night.isSheriff' : 'night.isMafia')} {positive ? t('night.result.yes') : t('night.result.no')}
                  </span>
                )}
              </div>
              <div className="chips">
                {alive.map((p) => (
                  <button
                    key={p.id}
                    className={`chip ${target === p.id ? 'is-selected' : ''}`}
                    onClick={() => dispatch({ type: 'NIGHT_TARGET', stepId: step.id, targetId: target === p.id ? null : p.id })}
                    aria-pressed={target === p.id}
                  >
                    <span className="seat">{state.players.indexOf(p) + 1}</span> {p.name}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="panel-footer">
        <button className="btn btn-primary btn-lg" onClick={() => dispatch({ type: 'RESOLVE_NIGHT' })}>
          ☀️ {t('night.resolve')}
        </button>
      </div>
    </div>
  );
}
