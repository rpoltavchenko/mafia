import { useMemo, useState } from 'react';
import { buildRules, rulesToText } from '../content/rules';
import { useGame } from '../game/GameContext';
import { useI18n } from '../i18n/I18nContext';

export default function RulesScreen() {
  const { state } = useGame();
  const { t, tk, lang, roleName } = useI18n();
  const [copied, setCopied] = useState(false);
  const rules = useMemo(() => buildRules(state, lang, roleName, tk), [state, lang, roleName, tk]);
  const text = useMemo(() => rulesToText(rules), [rules]);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Older browsers: fall back to a hidden textarea
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    try {
      await navigator.share({ title: rules.title, text });
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div className="screen rules">
      <section className="card rules-head">
        <div>
          <h2>📜 {rules.title}</h2>
          <p className="muted">{t('rules.hint')}</p>
        </div>
        <div className="row wrap no-print">
          {canShare && (
            <button className="btn btn-primary" onClick={share}>
              ↗ {t('rules.share')}
            </button>
          )}
          <button className={`btn ${canShare ? '' : 'btn-primary'}`} onClick={copy}>
            {copied ? `✓ ${t('rules.copied')}` : `⧉ ${t('rules.copy')}`}
          </button>
          <button className="btn btn-ghost" onClick={() => window.print()}>
            🖨 {t('rules.print')}
          </button>
        </div>
      </section>

      <div className="rules-grid">
        {rules.sections.map((sec) => (
          <section key={sec.title} className="card rules-section">
            <h3>
              <span aria-hidden>{sec.icon}</span> {sec.title}
            </h3>
            <ul>
              {sec.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
