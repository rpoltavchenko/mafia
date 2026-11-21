import type { ReactNode } from 'react';
import { useGame } from '../game/GameContext';
import { useBeep } from '../hooks/useBeep';
import { useTimerKeys } from '../hooks/useSpaceToggle';
import { useTimer } from '../hooks/useTimer';
import { useI18n } from '../i18n/I18nContext';
import TimerRing, { timerLevel } from './TimerRing';

interface Props {
  title: string;
  seconds: number;
  onDone: () => void;
  doneLabel: string;
  /** Text inside the ring; defaults to "Everyone" */
  label?: ReactNode;
}

/** A single countdown with no individual speaker – open discussion, Night 0 wake-ups. */
export default function DiscussionTimer({ title, seconds, onDone, doneLabel, label }: Props) {
  const { t } = useI18n();
  const { state } = useGame();
  const beep = useBeep(state.settings.sound, state.settings.vibrate);
  const timer = useTimer(seconds, { onExpire: beep.timeUp, onWarn: beep.warn });
  const toggle = () => {
    beep.unlock();
    timer.toggle();
  };
  useTimerKeys({ toggle, next: onDone });

  return (
    <div className={`timer-panel ${timerLevel(timer.status, timer.remainingMs)} status-${timer.status}`}>
      <div className="timer-head">
        <h3>{title}</h3>
      </div>
      <div className="timer-body">
      <TimerRing
        remainingMs={timer.remainingMs}
        totalMs={timer.totalMs}
        label={label ?? <>💬 {t('day.everyone')}</>}
        footer={timer.status === 'expired' && <span className="timer-up">{t('timer.timeUp')}</span>}
      />
      <div className="timer-side">
      <div className="timer-controls">
        <button className="btn btn-primary btn-lg timer-main" onClick={toggle}>
          {timer.status === 'running' ? `⏸ ${t('timer.pause')}` : timer.status === 'paused' ? `▶ ${t('timer.resume')}` : `▶ ${t('timer.start')}`}
        </button>
        <div className="timer-secondary">
        <button className="btn" onClick={() => timer.addTime(10)}>
          {t('timer.add')}
        </button>
        <button className="btn" onClick={timer.reset}>
          ↺ {t('timer.reset')}
        </button>
        <button className="btn btn-accent" onClick={onDone}>
          {doneLabel}
        </button>
        </div>
      </div>
      <p className="muted small keys-hint">{t('timer.keys')}</p>
      </div>
      </div>
    </div>
  );
}
