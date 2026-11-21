import { useGame } from '../game/GameContext';
import { displayName, seatOf } from '../game/players';

interface Props {
  id: string;
  /** 'lg' for headlines (reveal, timer), default for lists and buttons */
  size?: 'md' | 'lg';
}

/** A player shown the same way everywhere: seat number first and prominent, name second. */
export default function PlayerLabel({ id, size = 'md' }: Props) {
  const { state } = useGame();
  const seat = seatOf(state.players, id);
  const player = state.players[seat - 1];
  if (!player) return <span className="pl">?</span>;
  const name = displayName(player, seat);
  return (
    <span className={`pl pl-${size}`} title={name ? `#${seat} ${name}` : `#${seat}`}>
      <span className="pl-num">{seat}</span>
      {name && <span className="pl-name">{name}</span>}
    </span>
  );
}
