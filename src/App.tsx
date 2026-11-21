import { useEffect, useState } from 'react';
import LangToggle from './components/LangToggle';
import ThemeToggle from './components/ThemeToggle';
import { useGame } from './game/GameContext';
import type { Phase } from './game/types';
import { useI18n } from './i18n/I18nContext';
import AssignScreen from './screens/AssignScreen';
import EndScreen from './screens/EndScreen';
import GameScreen from './screens/GameScreen';
import HostLinesScreen from './screens/HostLinesScreen';
import RevealScreen from './screens/RevealScreen';
import RulesScreen from './screens/RulesScreen';
import SetupScreen from './screens/SetupScreen';

type View = 'game' | 'rules' | 'host';
const VIEWS: { id: View; icon: string }[] = [
  { id: 'game', icon: '🎩' },
  { id: 'rules', icon: '📜' },
  { id: 'host', icon: '🎤' },
];

const STEPS: Phase[] = ['setup', 'assign', 'reveal', 'night', 'ended'];

function stepIndex(phase: Phase) {
  if (phase === 'day' || phase === 'voting') return STEPS.indexOf('night');
  return STEPS.indexOf(phase);
}

export default function App() {
  const { state, dispatch } = useGame();
  const { t, tk } = useI18n();
  const current = stepIndex(state.phase);
  const [view, setView] = useState<View>('game');

  useEffect(() => {
    document.body.dataset.view = view;
    window.scrollTo(0, 0);
  }, [view]);

  const reset = () => {
    if (window.confirm(t('app.resetConfirm'))) dispatch({ type: 'RESET' });
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon" aria-hidden>🎩</span>
          <span className="brand-text">{t('app.title')}</span>
        </div>
        <nav className="views segmented" aria-label="sections">
          {VIEWS.map((v) => (
            <button key={v.id} className={view === v.id ? 'is-active' : ''} onClick={() => setView(v.id)} aria-pressed={view === v.id}>
              <span aria-hidden>{v.icon}</span>
              <span className="view-label">{tk(`nav.${v.id}`)}</span>
            </button>
          ))}
        </nav>
        <ol className="steps" aria-label="progress" hidden={view !== 'game'}>
          {STEPS.map((s, i) => (
            <li key={s} className={i === current ? 'is-current' : i < current ? 'is-done' : ''}>
              {s === 'night' ? t('game.round', { round: state.round || 1 }) : tk(`phase.${s}`)}
            </li>
          ))}
        </ol>
        <div className="topbar-actions">
          <ThemeToggle />
          <LangToggle />
          {state.phase !== 'setup' && (
            <button className="btn btn-ghost btn-sm" onClick={reset}>
              {t('app.reset')}
            </button>
          )}
        </div>
      </header>
      <main className="main">
        {view === 'rules' && <RulesScreen />}
        {view === 'host' && <HostLinesScreen />}
        {/* Kept mounted while other tabs are open so running timers aren't lost */}
        <div hidden={view !== 'game'}>
        {state.phase === 'setup' && <SetupScreen />}
        {state.phase === 'assign' && <AssignScreen />}
        {state.phase === 'reveal' && <RevealScreen />}
        {(state.phase === 'night' || state.phase === 'day' || state.phase === 'voting') && <GameScreen />}
        {state.phase === 'ended' && <EndScreen />}
        </div>
      </main>
    </div>
  );
}
