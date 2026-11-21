import { useState } from 'react';
import { CATEGORY_ICON, CATEGORY_ORDER, HOST_LINES, randomLine, type HostLine, type LineCategory } from '../content/hostLines';
import { useI18n } from '../i18n/I18nContext';

export default function HostLinesScreen() {
  const { t, tk } = useI18n();
  const [filter, setFilter] = useState<LineCategory | 'all'>('all');
  const cats = filter === 'all' ? CATEGORY_ORDER : [filter];
  const [featured, setFeatured] = useState(() => randomLine(CATEGORY_ORDER));

  const pick = () => setFeatured((prev) => randomLine(cats, prev.line));
  const choose = (c: LineCategory | 'all') => {
    setFilter(c);
    setFeatured(randomLine(c === 'all' ? CATEGORY_ORDER : [c]));
  };

  return (
    <div className="screen host-lines">
      <section className="card">
        <h2>🎤 {t('host.title')}</h2>
        <p className="muted">{t('host.hint')}</p>
        <div className="chips">
          <button className={`chip ${filter === 'all' ? 'is-selected' : ''}`} onClick={() => choose('all')}>
            {t('host.all')}
          </button>
          {CATEGORY_ORDER.map((c) => (
            <button key={c} className={`chip ${filter === c ? 'is-selected' : ''}`} onClick={() => choose(c)}>
              {CATEGORY_ICON[c]} {tk(`host.cat.${c}`)}
            </button>
          ))}
        </div>
      </section>

      <section className="card featured-line">
        <span className="featured-cat">
          {CATEGORY_ICON[featured.category]} {tk(`host.cat.${featured.category}`)}
        </span>
        <LineText line={featured.line} big />
        <button className="btn btn-primary btn-lg" onClick={pick}>
          🎲 {t('host.random')}
        </button>
      </section>

      {cats.map((c) => (
        <section key={c} className="card">
          <h3>
            {CATEGORY_ICON[c]} {tk(`host.cat.${c}`)}
          </h3>
          <ul className="line-list">
            {HOST_LINES[c].map((line, i) => (
              <li key={i}>
                <LineText line={line} />
              </li>
            ))}
          </ul>
        </section>
      ))}
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
