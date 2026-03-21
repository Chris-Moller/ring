# Plan: Nerf Bot AI Difficulty

## Summary

Add NPC bot players to the Ring - Battle Royale game with intentionally nerfed combat parameters so they serve as easier opponents. There is currently no bot code in the codebase — this is a greenfield implementation within the existing server architecture.

## Architecture

The existing `Game` class in `server/game.js` manages players, bullets, and tick-based updates. Bots will be implemented as server-side "fake players" that reuse the same `Player` data structure but have their input driven by AI logic each tick instead of WebSocket messages.

### Key Design Decisions

1. **Bots as regular players with a flag** — Add an `isBot: true` flag to bot player objects. The Game class already tracks players via `this.players` Map. Bots share the same data shape (x, y, hp, angle, input, alive) but don't have a real `ws` connection (`ws: null`).

2. **Bot AI runs in `tickActive()`** — A new `updateBots(dt, now)` method is called each tick during active game state, before `movePlayer()`. This method sets each bot's `input` and `angle` and calls `tryShoot()` when appropriate.

3. **NPC constants at the top of game.js** — Following the existing pattern of top-level constants:
   - `NPC_SHOOT_RANGE = 180` (nerfed from the described default of 250)
   - `NPC_SHOOT_ANGLE_TOLERANCE = 0.55` (nerfed from 0.3 — bots miss more)
   - `NPC_REACTION_DELAY_MS = 400` (300-500ms delay before first shot on a new target)
   - `NPC_COUNT = 3` (number of bots to spawn when filling the lobby)

4. **Reaction delay via per-bot target tracking** — Each bot tracks `botState.lastTargetId` and `botState.targetAcquiredAt` (timestamp). When a new enemy enters range, the bot sets `targetAcquiredAt = now` and won't shoot until `now - targetAcquiredAt >= NPC_REACTION_DELAY_MS`.

5. **Bot behaviors** (all functional, just less lethal):
   - **Move toward nearest enemy** when enemy is beyond close range
   - **Strafe** (random lateral movement) when close to an enemy
   - **Avoid ring boundary** — if outside the ring polygon, move toward centroid
   - **Wander randomly** when no enemy is in sight
   - **Shoot** only when target is in range, within angle tolerance, AND reaction delay has elapsed

6. **Bot spawning** — Bots are added via `addBot()` method. In `startRound()`, any existing bots participate. The `fillBots()` method ensures NPC_COUNT bots exist when needed. Bots are removed/reset alongside regular players in `resetForNextRound()`.

7. **Bot serialization** — The `isBot` flag is included in `getState()` serialization so the client can optionally distinguish them visually (e.g., different color label), but no client changes are required for core functionality.

## Files Changed

- **`server/game.js`** — All core changes:
  - Add NPC constants (top of file, after existing constants)
  - Add `addBot()` method to `Game`
  - Add `updateBots(dt, now)` method with AI state machine
  - Call `updateBots()` from `tickActive()` before player movement
  - Add `fillBots()` for auto-spawning bots in lobby
  - Handle bot cleanup in `resetForNextRound()`
  - Export new NPC constants
  - Include `isBot` in `getState()` player serialization

- **`server/index.js`** — Minimal change:
  - Call `game.fillBots()` after game creation to seed initial bots, or let Game self-manage

- **`test/game.test.js`** — Add tests for:
  - Bot creation and properties (`isBot`, `botState`)
  - NPC constants are correct values
  - Bot AI movement toward enemies
  - Reaction delay prevents instant shooting on new target
  - Ring avoidance behavior
  - Bot cleanup between rounds

## Acceptance Criteria Mapping

| Criterion | Implementation |
|-----------|---------------|
| NPC_SHOOT_RANGE ~180-200 | `NPC_SHOOT_RANGE = 180` |
| NPC_SHOOT_ANGLE_TOLERANCE ~0.5-0.6 | `NPC_SHOOT_ANGLE_TOLERANCE = 0.55` |
| Reaction delay 300-500ms | `NPC_REACTION_DELAY_MS = 400`, tracked per-bot via `botState.targetAcquiredAt` |
| Core behaviors maintained | AI logic: wander → approach → strafe → shoot, with ring avoidance override |
| Bots feel easier but still challenging | Wider aim + shorter range + delayed reaction = noticeably nerfed |

## Risks

- **Test count**: The existing 893 tests must continue to pass. Bot logic is additive, so no existing behavior changes.
- **Performance**: 3 bots × 20 ticks/sec = 60 AI updates/sec — negligible overhead.
- **Bot ws=null**: Must ensure broadcast/serialization code handles `ws: null` gracefully (it already does — `getState()` only reads player data, and broadcast iterates `wsToPlayer` map which only contains real connections).
