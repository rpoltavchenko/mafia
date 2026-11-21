import { useState } from 'react';
import { CATEGORY_ICON, CATEGORY_ORDER, HOST_LINES, randomLine, type HostLine, type LineCategory } from '../content/hostLines';
import { useI18n } from '../i18n/I18nContext';

export default function HostLinesScreen() {
  const { t, tk } = useI18n();
  const [cat, setCat] = useState<LineCategory>('nightFalls');
  const [featured, setFeatured] = useState(() => randomLine(['nightFalls']));

  const choose = (c: LineCategory) => {
    setCat(c);
    setFeatured(randomLine([c]));
  };
  const randomHere = () => setFeatured((prev) => randomLine([cat], prev.line));
  const randomAny = () => {
    const pick = randomLine(CATEGORY_ORDER, featured.line);
    setCat(pick.category);
    setFeatured(pick);
  };

  return (
    <div className="screen host-lines">
      <section className="card host-head">
        <div>
          <h2>🎤 {t('host.title')}</h2>
          <p className="muted">{t('host.hint')}</p>
        </div>
        <div className="chips" role="tablist">
          {CATEGORY_ORDER.map((c) => (
            <button key={c} role="tab" aria-selected={cat === c} className={`chip ${cat === c ? 'is-selected' : ''}`} onClick={() => choose(c)}>
              {CATEGORY_ICON[c]} {tk(`host.cat.${c}`)}
            </button>
          ))}
        </div>
      </section>

      <div className="host-grid">
        <section className="card featured-line">
          <span className="featured-cat">
            {CATEGORY_ICON[featured.category]} {tk(`host.cat.${featured.category}`)}
          </span>
          <LineText line={featured.line} big />
          <div className="row wrap featured-actions">
            <button className="btn btn-primary btn-lg" onClick={randomHere}>
              🎲 {t('host.random')}
            </button>
            <button className="btn" onClick={randomAny}>
              🔀 {t('host.any')}
            </button>
          </div>
        </section>

        <section className="card host-list">
          <h3>
            {CATEGORY_ICON[cat]} {tk(`host.cat.${cat}`)} <span className="muted small">· {HOST_LINES[cat].length}</span>
          </h3>
          <ul className="line-list">
            {HOST_LINES[cat].map((line, i) => (
              <li key={i}>
                <button className={`line-pick ${featured.line === line ? 'is-current' : ''}`} onClick={() => setFeatured({ line, category: cat })}>
                  <LineText line={line} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

export function LineText({ line, big = false }: { line: HostLine; big?: boolean }) {
  const { lang } = useI18n();
  return (
    <blockquote className={`line ${big ? 'is-big' : ''}`}>
      <p>{line.by ? `“${line[lang]}”` : line[lang]}</p>
      {line.by && <cite>— {line.by[lang]}</cite>}
    </blockquote>
  );
}
