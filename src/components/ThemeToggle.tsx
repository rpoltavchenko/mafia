import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';

type Theme = 'neon' | 'classic';
const KEY = 'mafia-theme';

export default function ThemeToggle() {
  const { t } = useI18n();
  const [theme, setTheme] = useState<Theme>(() => (document.documentElement.dataset.theme === 'classic' ? 'classic' : 'neon'));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    // Browser UI colour follows the page surface token
    const surface = getComputedStyle(document.documentElement).getPropertyValue('--surface-page').trim();
    if (surface) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', surface);
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const next = theme === 'neon' ? 'classic' : 'neon';
  return (
    <button
      className="icon-btn theme-toggle"
      onClick={() => setTheme(next)}
      title={t(next === 'neon' ? 'theme.neon' : 'theme.classic')}
      aria-label={t(next === 'neon' ? 'theme.neon' : 'theme.classic')}
    >
      {theme === 'neon' ? '🌴' : '🌙'}
    </button>
  );
}
