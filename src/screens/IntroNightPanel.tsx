import { useMemo, useState } from 'react';
import DiscussionTimer from '../components/DiscussionTimer';
import { useGame } from '../game/GameContext';
import { nightSteps } from '../game/night';
import { useI18n } from '../i18n/I18nContext';

/**
 * Night 0: each active role wakes up to meet the host (the Mafia team together).
 * No kills or checks — just a short timer per wake-up.
 */
export default function IntroNightPanel({ hideRoles }: { hideRoles: boolean }) {
  const { state, dispatch, roleById } = useGame();
  const { t, roleName } = useI18n();
  const [current, setCurrent] = useState(0);

  // The Don meets together with the Mafia team, so drop the Don's separate step
  const steps = useMemo(() => nightSteps(state.players, state.roles).filter((s) => s.action !== 'donCheck'), [state.players, state.roles]);
  const nameOf = (id: string) => state.players.find((p) => p.id === id)?.name ?? '?';
  const labelOf = (i: number) => (steps[i].id === 'mafia' ? t('night.mafiaActors') : roleName(roleById.get(steps[i].roleId)));
  const secondsOf = (i: number) => (steps[i].id === 'mafia' ? state.settings.introMafiaSeconds : state.settings.introRoleSeconds);
  const step = steps[current];

  return (
    <div className="card night-panel intro-panel">
      <h3>{t('intro.title')}</h3>
      <p className="muted">{t('intro.hint')}</p>

      <ol className="intro-steps">
        {steps.map((s, i) => {
          const role = roleById.get(s.roleId);
          const status = i < current ? 'is-done' : i === current ? 'is-current' : '';
          return (
            <li key={s.id} className={`intro-step ${status}`} style={{ '--role': role?.color } as React.CSSProperties}>
              <button className="intro-step-btn" onClick={() => setCurrent(i)} aria-current={i === current ? 'step' : undefined}>
                <span className="step-num">{i < current ? '✓' : i + 1}</span>
                <span className="intro-step-name">{labelOf(i)}</span>
                {!hideRoles && <small className="muted">{s.actors.map(nameOf).join(', ')}</small>}
                <small className="muted intro-step-time">{t('intro.sec', { n: secondsOf(i) })}</small>
              </button>
            </li>
          );
        })}
      </ol>

      {step ? (
        <>
          <p className="intro-instruction">
            {step.id === 'mafia' ? t('intro.mafiaHint') : t('intro.roleHint', { role: labelOf(current) })}
          </p>
          <DiscussionTimer
            key={step.id}
            title={labelOf(current)}
            seconds={secondsOf(current)}
            label={
              <>
                {step.id === 'mafia' ? '🕶️' : '👁️'} {labelOf(current)}
              </>
            }
            onDone={() => setCurrent((c) => c + 1)}
            doneLabel={current < steps.length - 1 ? t('intro.next') : t('intro.finishWakeups')}
          />
        </>
      ) : (
        <p className="done-msg">✅ {t('intro.allDone')}</p>
      )}

      <div className="panel-footer">
        <button className={`btn btn-lg ${step ? '' : 'btn-primary'}`} onClick={() => dispatch({ type: 'END_INTRO_NIGHT' })}>
          ☀️ {t('night.resolve')}
        </button>
      </div>
    </div>
  );
}
