import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';
import { historyReducer, initialHistory } from './history';
import { initialState, type Action } from './reducer';
import { loadGame, loadUndo, saveGame, saveUndo } from './storage';
import type { GameState, RoleDef } from './types';

interface GameCtx {
  state: GameState;
  dispatch: Dispatch<Action>;
  roleById: Map<string, RoleDef>;
  /** The action the Undo button would take back, or null if there is nothing to undo */
  lastAction: Action | null;
  undo: () => void;
  /** True right after an undo */
  restored: boolean;
}

const Ctx = createContext<GameCtx | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [history, dispatchHistory] = useReducer(historyReducer, undefined, () => {
    const present = loadGame() ?? initialState();
    return initialHistory(present, loadUndo(present));
  });
  const { present: state, past, restored } = history;

  useEffect(() => {
    saveGame(state);
    saveUndo(state, past);
  }, [state, past]);

  const dispatch = dispatchHistory as Dispatch<Action>;
  const undo = useCallback(() => dispatchHistory({ type: 'UNDO' }), []);
  const lastAction = past.length ? past[past.length - 1].action : null;
  const roleById = useMemo(() => new Map(state.roles.map((r) => [r.id, r])), [state.roles]);
  const value = useMemo(
    () => ({ state, dispatch, roleById, lastAction, undo, restored }),
    [state, dispatch, roleById, lastAction, undo, restored],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGame(): GameCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
