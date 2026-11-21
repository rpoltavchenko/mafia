import { useMemo, useState } from 'react';
import { boldParts, buildRules, rulesToText, type RulesSection } from '../content/rules';
import { useGame } from '../game/GameContext';
import { useI18n } from '../i18n/I18nContext';

function Rich({ text }: { text: string }) {
  return (
    <>
      {boldParts(text).map((p, i) => (p.bold ? <strong key={i}>{p.text}</strong> : <span key={i}>{p.text}</span>))}
    </>
  );
}

function Block({ num, section }: { num: number; section: RulesSection }) {
  return (
    <section className="rules-block">
      <h2 className="rules-h">
        <span className="rules-num">{num}</span>
        <span aria-hidden>{section.icon}</span> {section.title}
      </h2>
      <ul className="rules-list">
        {section.items.map((item, i) => (
          <li key={i}>
            <Rich text={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function RulesScreen() {
  const { state } = useGame();
  const { t, tk, lang, roleName } = useI18n();
  const [copied, setCopied] = useState(false);
  const rules = useMemo(() => buildRules(state, lang, roleName, tk), [state, lang, roleName, tk]);
  const text = useMemo(() => rulesToText(rules), [rules]);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const [goal, ...rest] = rules.sections;

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
      <div className="rules-actions no-print">
        <p className="muted">{t('rules.hint')}</p>
        <div className="row wrap">
          {canShare && (
            <button className="btn btn-primary" onClick={share}>
              ↗ {t('rules.share')}
            </button>
          )}
          <button className={`btn ${canShare ? '' : 'btn-primary'}`} onClick={copy}>
            {copied ? `✓ ${t('rules.copied')}` : `⧉ ${t('rules.copy')}`}
          </button>
          <button className="btn" onClick={() => window.print()}>
            🖨 {t('rules.print')}
          </button>
        </div>
      </div>

      <article className="rules-doc">
        <header className="rules-header">
          <h1 className="rules-title">🎩 {rules.title}</h1>
          <p className="rules-subtitle">{rules.subtitle}</p>
        </header>

        <dl className="rules-glance">
          {rules.glance.map((g) => (
            <div key={g.label}>
              <dt>{g.label}</dt>
              <dd>{g.value}</dd>
            </div>
          ))}
        </dl>

        <div className="rules-body">
          <Block num={1} section={goal} />

          <section className="rules-block">
            <h2 className="rules-h">
              <span className="rules-num">2</span>
              <span aria-hidden>🎭</span> {rules.rolesTitle}
            </h2>
            <ul className="rules-roles">
              {rules.roles.map((r) => (
                <li key={r.name} style={{ '--role': r.color } as React.CSSProperties}>
                  <span className="rules-role-dot" aria-hidden />
                  <div>
                    <div className="rules-role-head">
                      <strong>{r.name}</strong>
                      {r.count > 1 && <span className="rules-role-count">×{r.count}</span>}
                      <span className={`rules-team rules-team-${r.team}`}>{r.teamLabel}</span>
                    </div>
                    <p>{r.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {rest.map((sec, i) => (
            <Block key={sec.title} num={i + 3} section={sec} />
          ))}
        </div>
      </article>
    </div>
  );
}
