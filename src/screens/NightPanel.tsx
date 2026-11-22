import PhaseNav from '../components/PhaseNav';
import CheckMarks from '../components/CheckMarks';
import { playerText } from '../game/players';
import PlayerLabel from '../components/PlayerLabel';
import { useGame } from '../game/GameContext';
import { checkResult, nightSteps, targetBlock } from '../game/night';
import { useI18n } from '../i18n/I18nContext';

export default function NightPanel({ hideRoles }: { hideRoles: boolean }) {
  const { state, dispatch, roleById } = useGame();
  const { t, tk, roleName } = useI18n();
  const steps = nightSteps(state.players, state.roles);
  // roles that haven't chosen a target yet
  const waiting = steps
    .filter((s) => !state.night.targets[s.id])
    .map((s) => (s.id === 'mafia' ? tk('role.mafia') : roleName(roleById.get(s.roleId))));
  const alive = state.players.filter((p) => p.alive);
  const nameOf = (id: string) => playerText(state.players, id);

  return (
    <div className="card night-panel">
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
              <div className="player-grid">
                {alive.map((p) => {
                  const block = targetBlock(step, p.id, state.lastHeals);
                  return (
                    <button
                      key={p.id}
                      className={`chip chip-player ${target === p.id ? 'is-selected' : ''} ${block ? 'is-blocked' : ''}`}
                      onClick={() => dispatch({ type: 'NIGHT_TARGET', stepId: step.id, targetId: target === p.id ? null : p.id })}
                      aria-pressed={target === p.id}
                      disabled={!!block}
                      title={block ? t(block) : undefined}
                    >
                      <PlayerLabel id={p.id} />
                      {!hideRoles && (step.action === 'check' || step.action === 'donCheck') && <CheckMarks playerId={p.id} roleId={step.roleId} />}
                    </button>
                  );
                })}
              </div>
              {step.action === 'heal' && state.lastHeals[step.id] && alive.some((p) => p.id === state.lastHeals[step.id]) && (
                <p className="step-note">
                  🚫 {t('night.healNote', { name: playerText(state.players, state.lastHeals[step.id]!) })}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      <PhaseNav
        label={`☀️ ${t('night.resolve')}`}
        pending={waiting.length ? t('night.pendingRoles', { roles: waiting.join(', ') }) : null}
        confirmLabel={t('night.confirmMorning')}
        onGo={() => dispatch({ type: 'RESOLVE_NIGHT' })}
      />
    </div>
  );
}
