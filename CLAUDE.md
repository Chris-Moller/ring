# Integration Summary

## Plan Branch
agent/ac792021-565f-4be2-af80-5ea91525120f
## Upstream Repository
soli-testbench/ring

## Suggested PR Title
feat(arena): dynamic polygon maps with randomly generated arena shapes

## Suggested PR Description
## Summary

- Replaced the static circular arena with randomly generated convex polygon arenas (5-10 vertices) that change each round, creating varied tactical scenarios
- Implemented polygon geometry utilities: `generateConvexPolygon`, `pointInConvexPolygon`, `clampPointToPolygon`, `scalePolygonTowardCentroid`, `getPolygonCentroid`
- Adapted the shrinking ring mechanic to uniformly contract the polygon shape toward its centroid over the round duration
- Converted all boundary checks (player clamping, bullet out-of-bounds, ring damage, spawn positions) from distance-from-center to point-in-polygon logic
- Updated client rendering to draw polygon arena boundary, ring boundary, and danger zone overlay using Canvas polygon paths
- Polygon vertices (`arenaVertices`, `ringVertices`) are serialized in game state broadcasts

## Test plan

- [x] All 167 tests pass (22 updated existing tests + new polygon utility tests)
- [x] Polygon generation produces valid convex polygons with correct vertex counts
- [x] Point-in-polygon correctly classifies inside/outside points
- [x] Player movement clamped to polygon boundary
- [x] Ring shrinks toward centroid and damages players outside
- [x] Bullets removed when exiting polygon arena
- [x] Each round generates a different polygon shape
- [x] Spawn positions verified inside polygon
- [x] Game state serialization includes polygon vertex arrays

🤖 Generated with [Claude Code](https://claude.com/claude-code)

---

## Original Task

**Description**: Replace the static circular arena with randomly generated convex polygon shapes that change each round. Each round, the server generates a new arena boundary (e.g., a convex polygon with 5-10 vertices) inscribed roughly within the current ARENA_RADIUS. The shrinking ring mechanic should be adapted to uniformly contract the polygon shape toward its centroid over the round duration. All boundary checks (player clamping, bullet out-of-bounds, ring damage, spawn positions) must use point-in-polygon logic instead of distance-from-center. The generated shape vertices are serialized in game state and rendered on the client. Shapes should be simple enough to be visually clear but varied enough to create different tactical scenarios each round.

**Acceptance Criteria**:
1. Each new round generates a different convex polygon arena shape (5-10 vertices) that fits within the existing arena radius.
2. Players are clamped to the polygon boundary instead of a circle; movement outside the polygon edge is prevented.
3. The shrinking ring mechanic contracts the polygon uniformly toward its centroid over the round duration, and players outside the shrinking boundary take ring damage.
4. Bullets that exit the arena polygon are removed.
5. Player spawn positions are placed inside the generated polygon.
6. The polygon vertices are included in the game state broadcast and rendered correctly on the client.
7. All existing tests are updated to work with the new boundary system.
8. The game remains playable and performant with the new boundary checks (point-in-polygon should not cause frame drops).