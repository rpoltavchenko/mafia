import type { ReactNode } from 'react';
import type { TimerStatus } from '../hooks/useTimer';

const R = 88;
const C = 2 * Math.PI * R;

export function formatTime(ms: number) {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** CSS class for the colour stage: orange at 10 s, red at 5 s, flashing when over. */
export function timerLevel(status: TimerStatus, remainingMs: number) {
  const sec = remainingMs / 1000;
  return status === 'expired' ? 'is-over' : sec <= 5 ? 'is-danger' : sec <= 10 ? 'is-warn' : '';
}

interface Props {
  remainingMs: number;
  totalMs: number;
  label: ReactNode;
  footer?: ReactNode;
}

export default function TimerRing({ remainingMs, totalMs, label, footer }: Props) {
  const fraction = totalMs > 0 ? remainingMs / totalMs : 0;
  return (
    <div className="timer-ring-wrap">
      <svg className="timer-ring" viewBox="0 0 200 200" aria-hidden>
        <circle className="ring-bg" cx="100" cy="100" r={R} />
        <circle className="ring-fg" cx="100" cy="100" r={R} strokeDasharray={C} strokeDashoffset={C * (1 - fraction)} transform="rotate(-90 100 100)" />
      </svg>
      <div className="timer-center">
        <span className="timer-speaker">{label}</span>
        <span className="timer-time" role="timer" aria-live="off">
          {formatTime(remainingMs)}
        </span>
        {footer}
      </div>
    </div>
  );
}
