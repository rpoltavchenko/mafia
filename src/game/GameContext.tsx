import { createContext, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';
import { initialState, reducer, type Action } from './reducer';
import { loadGame, saveGame } from './storage';
import type { GameState, RoleDef } from './types';

interface GameCtx {
  state: GameState;
  dispatch: Dispatch<Action>;
  roleById: Map<string, RoleDef>;
}

const Ctx = createContext<GameCtx | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => loadGame() ?? initialState());

  useEffect(() => {
    saveGame(state);
  }, [state]);

  const roleById = useMemo(() => new Map(state.roles.map((r) => [r.id, r])), [state.roles]);
  const value = useMemo(() => ({ state, dispatch, roleById }), [state, roleById]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGame(): GameCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
