import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { RoleDef } from '../game/types';
import { en, type DictKey } from './en';
import { uk } from './uk';

export type Lang = 'en' | 'uk';
const DICTS = { en, uk };
const LANG_KEY = 'mafia-lang';

type Params = Record<string, string | number>;

interface I18n {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: DictKey, params?: Params) => string;
  /** Translate a key that is only known at runtime (e.g. from the log) */
  tk: (key: string, params?: Params) => string;
  roleName: (role: RoleDef | undefined) => string;
}

const Ctx = createContext<I18n | null>(null);

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'en' || saved === 'uk') return saved;
  } catch {
    /* ignore */
  }
  return navigator.language?.startsWith('uk') ? 'uk' : 'en';
}

function interpolate(s: string, params?: Params) {
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<I18n>(() => {
    const dict = DICTS[lang] as Record<string, string>;
    const tk = (key: string, params?: Params) => interpolate(dict[key] ?? key, params);
    return {
      lang,
      setLang,
      t: (key, params) => tk(key, params),
      tk,
      roleName: (role) => (role ? role.name ?? tk(`role.${role.id}`) : '—'),
    };
  }, [lang, setLang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
