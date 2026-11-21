import { useState } from 'react';
import Modal from '../components/Modal';
import { useGame } from '../game/GameContext';
import type { Player } from '../game/types';
import { useI18n } from '../i18n/I18nContext';

export default function RevealScreen() {
  const { state, dispatch } = useGame();
  const { t } = useI18n();
  const [current, setCurrent] = useState<Player | null>(null);
  const seen = state.players.filter((p) => p.seen).length;
  const allSeen = seen === state.players.length;

  return (
    <div className="screen reveal">
      <section className="card">
        <h2>{t('reveal.title')}</h2>
        <p className="muted">{t('reveal.hint')}</p>
        <div className="progress" aria-hidden>
          <div style={{ width: `${(seen / state.players.length) * 100}%` }} />
        </div>
        <p>{t('reveal.progress', { seen, total: state.players.length })}</p>
        <div className="reveal-grid">
          {state.players.map((p, i) => (
            <button key={p.id} className={`reveal-btn ${p.seen ? 'is-seen' : ''}`} onClick={() => setCurrent(p)}>
              <span className="seat">{i + 1}</span>
              <span>{p.name}</span>
              {p.seen && <small>✓ {t('reveal.seen')}</small>}
            </button>
          ))}
        </div>
      </section>
      <div className="footer-bar">
        <button className="btn btn-ghost" onClick={() => dispatch({ type: 'BACK_TO_ASSIGN' })}>
          {t('reveal.back')}
        </button>
        <button className={`btn btn-lg ${allSeen ? 'btn-primary' : ''}`} onClick={() => dispatch({ type: 'START_GAME' })}>
          {t('reveal.start')}
        </button>
      </div>
      {current && <RevealCard player={current} onDone={() => { dispatch({ type: 'MARK_SEEN', id: current.id }); setCurrent(null); }} onCancel={() => setCurrent(null)} />}
    </div>
  );
}

function RevealCard({ player, onDone, onCancel }: { player: Player; onDone: () => void; onCancel: () => void }) {
  const { state, roleById } = useGame();
  const { t, tk, roleName } = useI18n();
  const [shown, setShown] = useState(false);
  const role = player.roleId ? roleById.get(player.roleId) : undefined;
  const mates =
    role?.team === 'mafia'
      ? state.players.filter((p) => p.id !== player.id && p.roleId && roleById.get(p.roleId)?.team === 'mafia')
      : [];

  return (
    <Modal onClose={onCancel} className="reveal-modal">
      {!shown ? (
        <button className="reveal-cover" onClick={() => setShown(true)}>
          <span className="muted">{t('reveal.handTo')}</span>
          <strong className="reveal-name">{player.name}</strong>
          <span className="reveal-tap">👆 {t('reveal.tapToSee')}</span>
        </button>
      ) : (
        <div className="reveal-role" style={{ '--role': role?.color ?? 'var(--text-muted)' } as React.CSSProperties}>
          <span className="muted">{t('reveal.youAre')}</span>
          <strong className="reveal-role-name">{roleName(role)}</strong>
          {role && (
            <span className="muted">
              {tk(`team.${role.team}`)} · {tk(`action.${role.nightAction}`)}
            </span>
          )}
          {mates.length > 0 && (
            <div className="mates">
              <span className="muted">{t('reveal.teamMates')}:</span>{' '}
              {mates.map((m) => `${m.name} (${roleName(roleById.get(m.roleId!))})`).join(', ')}
            </div>
          )}
          <button className="btn btn-primary btn-lg" onClick={onDone}>
            {t('reveal.hide')}
          </button>
        </div>
      )}
    </Modal>
  );
}
