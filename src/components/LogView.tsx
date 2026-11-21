import { useGame } from '../game/GameContext';
import type { LogEntry } from '../game/types';
import { useI18n } from '../i18n/I18nContext';

const ICONS: Record<LogEntry['phase'], string> = { night: '🌙', day: '☀️', voting: '🗳️', host: '🎩' };

export default function LogView({ entries }: { entries: LogEntry[] }) {
  const { tk, roleName } = useI18n();
  const { roleById } = useGame();

  if (entries.length === 0) return <p className="muted">{tk('game.noLog')}</p>;

  const render = (e: LogEntry) => {
    const params = { ...e.params };
    if (typeof params.role === 'string') params.role = roleName(roleById.get(params.role));
    if (typeof params.team === 'string') params.team = tk(`team.${params.team}`);
    return tk(e.key, params);
  };

  return (
    <ol className="log">
      {entries
        .map((e, i) => (
          <li key={i}>
            <span className="log-round">{e.round}</span>
            <span aria-hidden>{ICONS[e.phase]}</span>
            <span>{render(e)}</span>
          </li>
        ))
        .reverse()}
    </ol>
  );
}
