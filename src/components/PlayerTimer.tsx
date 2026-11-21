import PlayerLabel from './PlayerLabel';
import { useEffect, useRef, type ReactNode } from 'react';
import TimerRing, { timerLevel } from './TimerRing';
import { useTimerKeys } from '../hooks/useSpaceToggle';
import { useGame } from '../game/GameContext';
import type { Player } from '../game/types';
import { useBeep } from '../hooks/useBeep';
import { useTimer } from '../hooks/useTimer';
import { useI18n } from '../i18n/I18nContext';

interface Props {
  title: string;
  queue: Player[];
  index: number;
  onIndexChange: (i: number) => void;
  seconds: number;
  /** Shown instead of the timer once everyone in the queue has spoken */
  done?: ReactNode;
  onActiveChange?: (id: string | null) => void;
  /** Extra controls under the timer for the current speaker (e.g. nominations) */
  renderSpeakerExtras?: (speaker: Player) => ReactNode;
}

export default function PlayerTimer({ title, queue, index, onIndexChange, seconds, done, onActiveChange, renderSpeakerExtras }: Props) {
  const { t } = useI18n();
  const { state } = useGame();
  const beep = useBeep(state.settings.sound, state.settings.vibrate);
  const timer = useTimer(seconds, { onExpire: beep.timeUp, onWarn: beep.warn });
  const current = queue[index];
  const autoStart = useRef(false);

  // New speaker → fresh timer; auto-start when the host pressed "Next"
  useEffect(() => {
    if (autoStart.current && current) timer.restart();
    else timer.reset();
    autoStart.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, seconds]);

  useEffect(() => {
    onActiveChange?.(current?.id ?? null);
  }, [current?.id, onActiveChange]);
  useEffect(() => () => onActiveChange?.(null), [onActiveChange]);

  const next = () => {
    autoStart.current = timer.status === 'running' || timer.status === 'expired';
    onIndexChange(index + 1);
  };
  const prev = () => onIndexChange(Math.max(0, index - 1));
  const toggle = () => {
    beep.unlock();
    timer.toggle();
  };

  useTimerKeys({ toggle, next, prev });

  if (!current) {
    return (
      <div className="timer-panel is-done">
        <h3>{title}</h3>
        {index > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={prev}>
            {t('timer.prev')}
          </button>
        )}
        {done}
      </div>
    );
  }

  const level = timerLevel(timer.status, timer.remainingMs);
  const upNext = queue.slice(index + 1);

  return (
    <div className={`timer-panel ${level} status-${timer.status}`}>
      <div className="timer-head">
        <h3>{title}</h3>
        <span className="muted">
          {index + 1} / {queue.length}
        </span>
      </div>

      <div className="timer-body">
      <TimerRing
        remainingMs={timer.remainingMs}
        totalMs={timer.totalMs}
        label={
          <>
            <PlayerLabel id={current.id} size="lg" />
          </>
        }
        footer={timer.status === 'expired' && <span className="timer-up">{t('timer.timeUp')}</span>}
      />

      <div className="timer-side">
      <div className="timer-controls">
        <button className="btn btn-primary btn-lg timer-main" onClick={toggle}>
          {timer.status === 'running' ? `⏸ ${t('timer.pause')}` : timer.status === 'paused' ? `▶ ${t('timer.resume')}` : `▶ ${t('timer.start')}`}
        </button>
        <div className="timer-secondary">
        <button className="btn" onClick={prev} disabled={index === 0} aria-label="previous">
          {t('timer.prev')}
        </button>
        <button className="btn" onClick={() => timer.addTime(10)}>
          {t('timer.add')}
        </button>
        <button className="btn" onClick={timer.reset}>
          ↺ {t('timer.reset')}
        </button>
        <button className="btn btn-accent" onClick={next}>
          {t('timer.next')}
        </button>
        </div>
      </div>
      {upNext.length > 0 && (
        <div className="queue">
          <span className="muted">{t('timer.upNext')}:</span>
          {upNext.slice(0, 3).map((p) => (
            <button key={p.id} className="chip chip-player" onClick={() => onIndexChange(queue.indexOf(p))}>
              <PlayerLabel id={p.id} />
            </button>
          ))}
          {upNext.length > 3 && <span className="queue-more muted">+{upNext.length - 3}</span>}
        </div>
      )}
      <p className="muted small keys-hint">{t('timer.keys')}</p>
      </div>
      </div>

      {renderSpeakerExtras?.(current)}
    </div>
  );
}
