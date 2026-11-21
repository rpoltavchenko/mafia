import { useEffect, useMemo, useState } from 'react';
import { CATEGORY_ICON, categoriesForPhase, randomLine } from '../content/hostLines';
import { useGame } from '../game/GameContext';
import { useI18n } from '../i18n/I18nContext';
import { LineText } from '../screens/HostLinesScreen';

/** A suggested line for the host that fits the current phase. */
export default function HostLineCard() {
  const { state } = useGame();
  const { t, tk } = useI18n();
  const cats = useMemo(() => categoriesForPhase(state.phase, state.vote.stage), [state.phase, state.vote.stage]);
  const [current, setCurrent] = useState(() => randomLine(cats));

  // New phase → new suggestion
  useEffect(() => setCurrent(randomLine(cats)), [cats]);

  return (
    <div className="card host-card">
      <div className="row between">
        <span className="featured-cat">
          🎤 {t('host.suggest')} · {CATEGORY_ICON[current.category]} {tk(`host.cat.${current.category}`)}
        </span>
        <button className="btn btn-sm" onClick={() => setCurrent((prev) => randomLine(cats, prev.line))}>
          🎲 {t('host.another')}
        </button>
      </div>
      <LineText line={current.line} />
    </div>
  );
}
