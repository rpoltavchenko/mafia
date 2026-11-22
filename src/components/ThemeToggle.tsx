import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';

type Theme = 'neon' | 'sunset' | 'classic';
const ORDER: Theme[] = ['neon', 'sunset', 'classic'];
const ICON: Record<Theme, string> = { neon: '🌴', sunset: '🌅', classic: '🌙' };
const KEY = 'mafia-theme';

export default function ThemeToggle() {
  const { t } = useI18n();
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = document.documentElement.dataset.theme as Theme;
    return ORDER.includes(saved) ? saved : 'neon';
  });

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

  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
  return (
    <button
      className="icon-btn theme-toggle"
      onClick={() => setTheme(next)}
      title={`${t(`theme.${theme}` as 'theme.neon')} → ${t(`theme.${next}` as 'theme.neon')}`}
      aria-label={`${t(`theme.${theme}` as 'theme.neon')} → ${t(`theme.${next}` as 'theme.neon')}`}
    >
      {ICON[theme]}
    </button>
  );
}
