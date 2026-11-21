# Mafia Host

A browser app for the host of a Mafia game: set up players and roles, assign roles, let players reveal their roles by passing the phone, run nights, days and votes, and time every speech.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173. The dev server also listens on your local network, so you can open it from a phone on the same Wi‑Fi (use the "Network" URL Vite prints).

```bash
npm test        # game logic tests
npm run build   # production build in dist/
```

## How a game goes

1. **Setup**: number of players (4–20), names and seat order, role counts ("Suggest roles" fills a balanced set), custom roles, timer lengths.
2. **Roles**: roles are shuffled. Pick a role by hand to lock it; "Shuffle" only changes unlocked players.
3. **Reveal** (optional): pass the phone. Each player taps their name, sees their role (Mafia also see their team), then hides it.
4. **Night**: wake roles in order (Mafia → Don → Sheriff → Doctor → Maniac → custom) and tap each target. Checks show YES/NO for the host. "Morning" resolves the night: a Doctor heal cancels the kill.
5. **Day**: starts with an open discussion (60 s by default) where anyone can talk. Then alive players speak in seat order; the first speaker moves one seat each round. Each speech has its own timer, and at the end of a speech the speaker can nominate one player.
6. **Voting**: the day's nominees are on the ballot (the host can still add or remove). Every alive player votes: enter votes for each nominee except the last, and the last nominee automatically gets all remaining votes (10 alive, votes 2 and 2 → the last nominee gets 6). A tie leads to defense speeches and a re-vote; a second tie lets the host eliminate everyone tied or nobody. Eliminated players get a last-word timer.
7. The game ends automatically when one side wins (Mafia ≥ the rest; Town when no Mafia or Maniac is left).

Tap any player tile to add/remove fouls or remove/revive a player. "Hide roles" hides all roles and the log when players can see the screen.

**Timer keys**: Space = start/pause, N or → = next speaker, ← = previous. The timer turns orange at 10 s, red at 5 s, and beeps/vibrates at 0.

The game is saved in the browser, so refreshing the page doesn't lose it.
