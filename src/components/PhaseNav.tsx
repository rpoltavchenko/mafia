import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';

interface Props {
  /** Button text, e.g. "Go to voting →" */
  label: string;
  onGo: () => void;
  /**
   * Set when moving on now would skip something (e.g. "3 players haven't spoken yet").
   * The button is then quiet and asks for confirmation; otherwise it is the main action.
   */
  pending?: string | null;
  /** Text for the confirm button, e.g. "Yes, go to voting" */
  confirmLabel?: string;
  /** Extra phase-level actions shown to the left (e.g. "Nobody nominated — go to night") */
  children?: React.ReactNode;
}

/**
 * The bar that moves the game to the next phase. It is visually separate from
 * in-phase controls (timers, steppers) so it is never confused with them.
 */
export default function PhaseNav({ label, onGo, pending = null, confirmLabel, children }: Props) {
  const { t } = useI18n();
  const [confirming, setConfirming] = useState(false);

  // If the reason to confirm goes away (or changes), drop the pending confirmation
  useEffect(() => setConfirming(false), [pending]);

  return (
    <nav className={`phase-nav ${pending ? 'is-early' : 'is-ready'}`} aria-label={t('phaseNav.label')}>
      {confirming && pending ? (
        <div className="phase-nav-confirm" role="alert">
          <p>⚠️ {pending}</p>
          <div className="phase-nav-actions">
            <button className="btn" onClick={() => setConfirming(false)} autoFocus>
              {t('phaseNav.stay')}
            </button>
            <button className="btn btn-danger" onClick={onGo}>
              {confirmLabel ?? label}
            </button>
          </div>
        </div>
      ) : (
        <>
          <span className="phase-nav-label">{pending ? `⏳ ${pending}` : t('phaseNav.label')}</span>
          <div className="phase-nav-actions">
            {children}
            <button className={`btn btn-lg ${pending ? '' : 'btn-primary'}`} onClick={() => (pending ? setConfirming(true) : onGo())}>
              {label}
            </button>
          </div>
        </>
      )}
    </nav>
  );
}
