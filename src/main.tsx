import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { GameProvider } from './game/GameContext';
import { I18nProvider } from './i18n/I18nContext';
// Self-hosted fonts (bundled, so they work offline): only the Latin and Cyrillic subsets.
// Anton has no Cyrillic; Ukrainian headings fall back as before.
import '@fontsource/anton/latin-400.css';
import '@fontsource/anton/latin-ext-400.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-ext-400.css';
import '@fontsource/inter/cyrillic-400.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-ext-600.css';
import '@fontsource/inter/cyrillic-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/inter/latin-ext-700.css';
import '@fontsource/inter/cyrillic-700.css';
import '@fontsource/inter/latin-800.css';
import '@fontsource/inter/latin-ext-800.css';
import '@fontsource/inter/cyrillic-800.css';
import './tokens.css';
import './styles.css';
import './theme-neon.css';
import './daynight.css';
import './layout.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <GameProvider>
        <App />
      </GameProvider>
    </I18nProvider>
  </StrictMode>,
);
