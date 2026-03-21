'use strict';

const NPC_NAMES = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Ghost', 'Hawk'];
const MAX_NPC_COUNT = 4;
const MIN_REAL_PLAYERS_FOR_NO_BOTS = 4;
const NPC_SHOOT_RANGE = 200;
const NPC_AIM_TOLERANCE = 0.3;
const NPC_RING_DANGER_MARGIN = 50;

function createNPC(id, name) {
  return {
    id,
    ws: null,
    x: 0,
    y: 0,
    angle: 0,
    hp: 100,
    alive: true,
    lastShot: 0,
    input: { up: false, down: false, left: false, right: false },
    name: name,
    isNPC: true,
  };
}

function updateNPCAI(npc, ctx) {
  const { players, ringVertices, arenaCentroid, pointInPolygon, spectators, npcIds } = ctx;

  if (!npc.alive) return { shoot: false };

  // Reset inputs
  npc.input.up = false;
  npc.input.down = false;
  npc.input.left = false;
  npc.input.right = false;

  // Check if NPC is outside ring polygon -> move toward centroid
  const insideRing = pointInPolygon(npc.x, npc.y, ringVertices);

  if (!insideRing) {
    setMovementToward(npc, arenaCentroid.x, arenaCentroid.y);
    return { shoot: false };
  }

  // Find nearest alive enemy (real or NPC, excluding self)
  let nearestEnemy = null;
  let nearestDist = Infinity;

  for (const [pid, player] of players) {
    if (pid === npc.id) continue;
    if (!player.alive) continue;
    if (spectators.has(pid)) continue;

    const dx = player.x - npc.x;
    const dy = player.y - npc.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < nearestDist) {
      nearestDist = dist;
      nearestEnemy = player;
    }
  }

  if (nearestEnemy && nearestDist < NPC_SHOOT_RANGE) {
    // Aim at enemy
    const dx = nearestEnemy.x - npc.x;
    const dy = nearestEnemy.y - npc.y;
    const angleToEnemy = Math.atan2(dy, dx);
    npc.angle = angleToEnemy;

    // Move toward enemy
    setMovementToward(npc, nearestEnemy.x, nearestEnemy.y);

    // Shoot if angle difference is small enough
    const angleDiff = Math.abs(normalizeAngle(angleToEnemy - npc.angle));
    if (angleDiff < NPC_AIM_TOLERANCE) {
      return { shoot: true };
    }
    return { shoot: false };
  }

  // No nearby enemy: move toward centroid with some randomness
  const targetX = arenaCentroid.x + (Math.random() - 0.5) * 100;
  const targetY = arenaCentroid.y + (Math.random() - 0.5) * 100;
  setMovementToward(npc, targetX, targetY);

  return { shoot: false };
}

function setMovementToward(npc, targetX, targetY) {
  const dx = targetX - npc.x;
  const dy = targetY - npc.y;

  if (dx > 10) npc.input.right = true;
  else if (dx < -10) npc.input.left = true;

  if (dy > 10) npc.input.down = true;
  else if (dy < -10) npc.input.up = true;
}

function normalizeAngle(angle) {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

module.exports = {
  NPC_NAMES,
  MAX_NPC_COUNT,
  MIN_REAL_PLAYERS_FOR_NO_BOTS,
  NPC_SHOOT_RANGE,
  NPC_AIM_TOLERANCE,
  NPC_RING_DANGER_MARGIN,
  createNPC,
  updateNPCAI,
};
