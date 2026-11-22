import PlayerLabel from '../components/PlayerLabel';
import LogView from '../components/LogView';
import RoleBadge from '../components/RoleBadge';
import UndoButton from '../components/UndoButton';
import { useGame } from '../game/GameContext';
import { useI18n } from '../i18n/I18nContext';

export default function EndScreen() {
  const { state, dispatch, roleById, lastAction } = useGame();
  const { t } = useI18n();
  const title = t(state.winner ? (`end.winner.${state.winner}` as const) : 'end.winner.none');

  return (
    <div className={`screen end winner-${state.winner ?? 'none'}`}>
      <section className="card end-hero">
        <p className="muted">{t('end.title')}</p>
        <h2 className="end-title">{title}</h2>
      </section>
      <div className="end-grid">
        <section className="card">
          <h3>{t('end.roles')}</h3>
          <ul className="end-roles">
            {state.players.map((p) => (
              <li key={p.id} className={p.alive ? '' : 'is-dead'}>
                <span className="end-name">
                  <PlayerLabel id={p.id} />
                </span>
                <RoleBadge role={p.roleId ? roleById.get(p.roleId) : undefined} />
              </li>
            ))}
          </ul>
        </section>
        <section className="card">
          <h3>{t('game.log')}</h3>
          <LogView entries={state.log} />
        </section>
      </div>
      <div className="footer-bar">
        <div className="row">
          {/* e.g. the game ended automatically after a player was removed by mistake */}
          {lastAction && <UndoButton />}
          <button className="btn btn-ghost" onClick={() => dispatch({ type: 'RESET' })}>
            {t('end.reset')}
          </button>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => dispatch({ type: 'NEW_GAME_SAME_PLAYERS' })}>
          🔁 {t('end.again')}
        </button>
      </div>
    </div>
  );
}
