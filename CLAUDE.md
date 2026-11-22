# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"Mafia Host": a client-only React 18 + TypeScript + Vite app that a game host uses on a phone/laptop to run a Mafia game (setup → role assignment → pass-the-phone reveal → nights/days/votes with speech timers → end). No backend; state persists in `localStorage`. UI is bilingual (English / Ukrainian).

## Commands

```bash
npm run dev                         # Vite on :5173, also exposed on LAN (host: true) for phone testing
npm test                            # vitest run (game logic only, src/game/__tests__)
npx vitest run src/game/__tests__/reducer.test.ts   # single file
npx vitest run -t "doctor"          # tests matching a name
npm run build                       # tsc -b && vite build → dist/ (this is also the type check)
```

```bash
npm run lint                        # ESLint 9 flat config (eslint.config.js), --max-warnings 0
```

`.claude/launch.json` defines the `mafia` preview config (`npm run dev`, port 5173).

Two browser-console scripts in `scripts/` (paste into DevTools with the dev server running; they are not Node scripts):
- `check-contrast.js` — WCAG AA check across every theme × phase. Run after any colour change.
- `ui-audit.js` — loads a worst-case game (20 players, long Latin/Cyrillic names, etc.) in hidden frames and reports text overflow / horizontal scroll, e.g. `await __auditRun({ sizes: [[1280, 800], [390, 844]], langs: ['en', 'uk'], themes: ['neon'] })`. Restores the real saved game afterwards.

## Architecture

**Game logic is pure and separate from UI** (`src/game/`):
- `types.ts` — `GameState` is the single source of truth: `phase` (`setup | assign | reveal | night | day | voting | ended`), `round`, players, roles, settings, and per-phase sub-state (`night.targets`, `speech`, `vote` with its own `stage` machine `nominate → vote → defense/revote/tie → lastWord`), `checks`, `lastHeals`, `log`, `winner`.
- `reducer.ts` — every state transition is an `Action` handled here; also holds `DEFAULT_SETTINGS`, `initialState`, and player limits (4–20). Win checking (`winCheck.ts`) runs from the reducer after deaths.
- `night.ts` — `nightSteps()` derives the night's wake-up steps from who is alive (all Mafia-team killers share one `'mafia'` step; others ordered by `NIGHT_ORDER` in `roles.ts`, custom roles last), `targetBlock()` encodes targeting rules, `resolveNight()` applies kills/heals/checks.
- Roles are data (`RoleDef` with `team` + `nightAction`), so custom roles plug into night logic generically. Built-in role names are translated via `role.<id>`; custom roles carry a literal `name`.
- `history.ts` wraps the game reducer with undo (`historyReducer`): only actions taken during night/day/voting (and ending the game) are recorded, up to `UNDO_LIMIT`; repeated `SET_VOTES` on one nominee merge into one step. Undo steps persist under `mafia-undo-v1` and are only restored if they match the saved game.
- `GameContext.tsx` runs `historyReducer` and saves on every state change (exposes `undo`, `lastAction`, `restored`); `storage.ts` loads with key `mafia-game-v1` and **back-fills fields added after v1** — when adding a field to `GameState`/`Settings`, add a default there too so old saved games keep loading.

**UI** (`src/App.tsx`, `src/screens/`, `src/components/`): `App` switches screens on `state.phase`, plus top-level tabs Game / Rules / Host lines (`#rules`, `#host` hash URLs). The game view stays mounted (hidden) while other tabs are open so running timers survive. `GameScreen` hosts `NightPanel` / `IntroNightPanel` / `DayPanel` / `VotingPanel`. Timers live in `src/hooks/useTimer.ts` (with `useBeep`, `useSpaceToggle` for keyboard control).

**i18n** (`src/i18n/`): `en.ts` is the typed source dictionary (`DictKey`); `uk.ts` is typed as `Dict`, so every key must exist in both. Use `t(key)` for static keys, `tk(key)` for runtime-built keys (e.g. log entries store an i18n `key` + `params`, not text). Long-form content (`src/content/rules.ts`, `hostLines.ts`) holds `en`/`uk` side by side instead of using the dictionaries.

## Styling and colour rules

CSS is plain global stylesheets imported in `main.tsx` (`tokens.css`, `styles.css`, `theme-neon.css`, `daynight.css`, `layout.css`). Themes (`neon`, `sunset`, `classic`) are set via `html[data-theme]` (an inline script in `index.html` applies the saved theme before render; `ThemeToggle` cycles them), and the in-game phase via `html[data-phase="night|day|voting|none"]` set by `App`.

`src/tokens.css` has three layers: primitives (`--c-*`, never used by components) → semantic tokens (`--surface-*`, `--text*`, `--accent*`, `--on-accent`, `--team-*`, `--role-*`, …) → theme/phase overrides that only redefine semantic tokens. Rules:
- No hex/rgb in component CSS or TSX — use a semantic token, or `color-mix()` from one for tints.
- Text on a filled accent uses `--on-accent`.
- Role colours are tokens (`var(--role-sheriff)`, `var(--role-custom-N)`); `storage.ts` re-applies built-in role colours on load so themes can change them.

Check UI changes at phone width and in both languages (Ukrainian strings run longer).
