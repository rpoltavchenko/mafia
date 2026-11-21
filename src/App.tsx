import LangToggle from './components/LangToggle';
import { useGame } from './game/GameContext';
import type { Phase } from './game/types';
import { useI18n } from './i18n/I18nContext';
import AssignScreen from './screens/AssignScreen';
import EndScreen from './screens/EndScreen';
import GameScreen from './screens/GameScreen';
import RevealScreen from './screens/RevealScreen';
import SetupScreen from './screens/SetupScreen';

const STEPS: Phase[] = ['setup', 'assign', 'reveal', 'night', 'ended'];

function stepIndex(phase: Phase) {
  if (phase === 'day' || phase === 'voting') return STEPS.indexOf('night');
  return STEPS.indexOf(phase);
}

export default function App() {
  const { state, dispatch } = useGame();
  const { t, tk } = useI18n();
  const current = stepIndex(state.phase);

  const reset = () => {
    if (window.confirm(t('app.resetConfirm'))) dispatch({ type: 'RESET' });
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon" aria-hidden>🎩</span>
          <span>{t('app.title')}</span>
        </div>
        <ol className="steps" aria-label="progress">
          {STEPS.map((s, i) => (
            <li key={s} className={i === current ? 'is-current' : i < current ? 'is-done' : ''}>
              {s === 'night' ? t('game.round', { round: state.round || 1 }) : tk(`phase.${s}`)}
            </li>
          ))}
        </ol>
        <div className="topbar-actions">
          <LangToggle />
          {state.phase !== 'setup' && (
            <button className="btn btn-ghost btn-sm" onClick={reset}>
              {t('app.reset')}
            </button>
          )}
        </div>
      </header>
      <main className="main">
        {state.phase === 'setup' && <SetupScreen />}
        {state.phase === 'assign' && <AssignScreen />}
        {state.phase === 'reveal' && <RevealScreen />}
        {(state.phase === 'night' || state.phase === 'day' || state.phase === 'voting') && <GameScreen />}
        {state.phase === 'ended' && <EndScreen />}
      </main>
    </div>
  );
}
