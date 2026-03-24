# Integration Summary

## Plan Branch
agent/a90ad6d9-70e2-47c3-8054-bc276cf3c4ea
## Upstream Repository
soli-testbench/ring

## Suggested PR Title
Nerf Bot AI Difficulty

## Suggested PR Description
Created implementation plan for nerfed NPC bot AI system with reduced shoot range (180), widened aim tolerance (0.55 rad), and 400ms reaction delay

---

## Original Task

**Description**: Reduce NPC bot combat effectiveness to make them feel like easier opponents for players. The bots currently have tight aim tolerance (0.3 rad), long shoot range (250 units), and instant target acquisition. Adjustments should include: reducing shoot range, widening aim angle tolerance (making bots less accurate), and adding a reaction delay before bots start shooting at a newly spotted enemy. The bots should still be functional opponents that move, shoot, and avoid the ring — just noticeably less lethal.

**Acceptance Criteria**:
1. NPC_SHOOT_RANGE is reduced (e.g., from 250 to ~180-200).
2. NPC_SHOOT_ANGLE_TOLERANCE is increased (e.g., from 0.3 to ~0.5-0.6 radians) so bots miss more often.
3. A reaction delay is added so bots don't instantly shoot when an enemy enters range (e.g., 300-500ms delay before first shot on a new target).
4. Bots still exhibit core behaviors: moving toward enemies, strafing at close range, avoiding the ring boundary, and wandering when no enemy is found.
5. Playtested to confirm bots feel noticeably easier but still provide a baseline challenge.