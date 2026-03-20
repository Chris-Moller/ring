# Plan: Destructible Cover Obstacles

## Overview

Add destructible obstacles (crates, rocks) to the arena that block movement, absorb bullet damage, and are destroyed by the shrinking ring. This is a single-agent task since all changes are tightly coupled across server game logic, state serialization, and client rendering.

## Architecture

### Server-Side (server/game.js)

**New Constants:**
- `OBSTACLE_TYPES`: Array of `[{ type: 'crate', hp: 80 }, { type: 'rock', hp: 150 }]`
- `OBSTACLE_RADIUS`: 20px — obstacles modeled as circles for simpler collision math (matching the game's existing circle-based collision for players/bullets)
- `OBSTACLE_DENSITY`: Scale factor for count relative to arena area — target ~1 obstacle per 40,000 sq px of arena area
- `OBSTACLE_MIN_SPAWN_DIST`: Minimum distance from player spawn points (e.g., 60px) to avoid overlapping spawns

**New Data Structure:**
Each obstacle is a plain object:
```js
{
  id: number,
  type: 'crate' | 'rock',
  x: number,
  y: number,
  hp: number,
  maxHp: number,
  alive: true
}
```

**New Utility Function — `polygonArea(vertices)`:**
- Shoelace formula to compute convex polygon area, used for density scaling

**Obstacle Spawning (in `startRound()`):**
1. Calculate obstacle count based on arena polygon area using shoelace formula
2. Collect player spawn positions first (they're set just above in startRound)
3. For each obstacle, use `randomPointInPolygon()` (existing utility) to pick a position
4. Reject positions too close to any player spawn point (within `OBSTACLE_MIN_SPAWN_DIST`) or too close to other obstacles (within `OBSTACLE_RADIUS * 2`)
5. Assign random type from `OBSTACLE_TYPES`
6. Store in `this.obstacles` array

**Player-Obstacle Collision (in `movePlayer()`):**
- After computing `newX`, `newY`, before polygon clamping, check distance to each alive obstacle
- If `dist(newX, newY, obstacle) < PLAYER_RADIUS + OBSTACLE_RADIUS`, reject the move (keep old position)
- Simple circle-circle collision — consistent with existing bullet-player collision approach

**Bullet-Obstacle Collision (in `updateBullets()`):**
- In the bullet filter loop, after checking player collisions but before checking arena bounds
- For each alive obstacle, check `dist(bullet, obstacle) < BULLET_RADIUS + OBSTACLE_RADIUS`
- On hit: decrement obstacle HP by `bullet.damage`; if `hp <= 0`, set `alive = false`; consume bullet

**Ring Destruction (in `tickActive()`):**
- After ring vertex recalculation, iterate obstacles
- Any alive obstacle whose center is outside the ring polygon → set `alive = false`
- Use existing `pointInConvexPolygon()` to check

**State Serialization (in `getState()`):**
- Add `obstacles` array to returned state:
```js
obstacles: this.obstacles.filter(o => o.alive).map(o => ({
  id: o.id, type: o.type, x: o.x, y: o.y, hp: o.hp, maxHp: o.maxHp
}))
```

**Round Reset (in `resetForNextRound()`):**
- Clear `this.obstacles = []` — new obstacles will be spawned by next `startRound()`

**Constructor:**
- Initialize `this.obstacles = []`

### Client-Side (client/client.js)

**Rendering Obstacles:**
- In the `render()` function, after drawing grid lines and before drawing bullets
- Iterate `gameState.obstacles` (if present)
- For each obstacle, draw based on type:
  - **Crate**: Brown/wood-colored square (~18px side) with cross-hatch lines
  - **Rock**: Gray irregular polygon (rough circle with ~6 vertices at slightly random radii)
- Draw HP bar below each obstacle (similar style to player HP bars but smaller)
- Only render alive obstacles (server already filters dead ones out of getState)

### Tests (test/game.test.js)

New tests to add:
1. **Obstacles spawn at round start**: After `startRound()`, `game.obstacles` exists, has length > 0, and all obstacles are inside the arena polygon
2. **Obstacles avoid player spawns**: No obstacle center is within `OBSTACLE_MIN_SPAWN_DIST` of any player spawn position
3. **Player-obstacle collision**: Set player next to an obstacle, try to move through it, verify position doesn't cross the obstacle
4. **Bullet-obstacle collision**: Place bullet on top of obstacle, run `updateBullets()`, verify obstacle HP decreased and bullet consumed
5. **Obstacle destruction at 0 HP**: Hit obstacle enough times to reach 0 HP, verify `alive === false`
6. **Ring destroys obstacles outside boundary**: Shrink ring very small, verify obstacles outside ring are destroyed
7. **State serialization includes obstacles**: `getState()` returns obstacles array with correct fields (id, type, x, y, hp, maxHp)
8. **Destroyed obstacles excluded from state**: Dead obstacles not in `getState()` output
9. **Obstacle count scales with arena size**: Verify count is proportional to computed area

## Key Design Decisions

1. **Circle-based obstacle collision** rather than rectangular: The game already uses circle-circle for all collisions (player radius, bullet radius). Keeping this consistent simplifies math and avoids introducing new geometry. Visually they'll still appear as crates/rocks.

2. **Obstacles spawned in `startRound()`** not constructor: Obstacles are per-round, matching how players are respawned. During lobby, no obstacles are shown (keeps lobby clean for players to walk around).

3. **Server filters dead obstacles in `getState()`**: Reduces bandwidth and simplifies client rendering — client only sees alive obstacles.

4. **Arena area calculation via shoelace formula**: Needed for density scaling. O(n) algorithm.

5. **Obstacle-obstacle minimum distance**: Prevents overlapping obstacles which would look bad and create impassable walls.

## Files Changed

- `server/game.js` — All server-side obstacle logic (constants, spawning, collision, ring destruction, state)
- `client/client.js` — Obstacle rendering
- `test/game.test.js` — New obstacle tests + updated imports

## No New Dependencies

All implementation uses existing vanilla JS. No new npm packages needed.
