import { useI18n, type Lang } from '../i18n/I18nContext';

const LANGS: { id: Lang; label: string }[] = [
  { id: 'en', label: 'EN' },
  { id: 'uk', label: 'UA' },
];

export default function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="segmented" role="group" aria-label="Language">
      {LANGS.map((l) => (
        <button key={l.id} className={lang === l.id ? 'is-active' : ''} onClick={() => setLang(l.id)} aria-pressed={lang === l.id}>
          {l.label}
        </button>
      ))}
    </div>
  );
}
