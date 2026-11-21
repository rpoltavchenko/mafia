import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { GameProvider } from './game/GameContext';
import { I18nProvider } from './i18n/I18nContext';
import './styles.css';
import './theme-neon.css';
import './daynight.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <GameProvider>
        <App />
      </GameProvider>
    </I18nProvider>
  </StrictMode>,
);
