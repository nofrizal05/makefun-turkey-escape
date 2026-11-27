// The game's rules and state, with no drawing and no browser in it: the turkey running
// three lanes toward the forest, the farmer chasing from behind, the obstacles and corn
// scrolling in, score, lives, level and the escape goal. step() advances one fixed step
// and returns what happened as bit flags, so the caller can react without the world
// knowing about screens or sound. Nothing here allocates after createWorld returns.
import {
  CORN, FARMER, FIELD, GOAL_METRES, LANE_SCALE, LANES, LEVEL, LIVES, METRES_PER_PX,
  OBSTACLE, PIE, POOL_SIZE, SPEED, SPAWN, STEP, TURKEY,
} from './config.js';

export const KIND_OBSTACLE = 0;
export const KIND_CORN = 1;
export const KIND_GOLDEN = 2;
export const KIND_PIE = 3;

export const EVENT_HIT = 1;
export const EVENT_CORN = 2;
export const EVENT_OVER = 4;
export const EVENT_ESCAPED = 8;
export const EVENT_STUMBLE = 16;

const OBSTACLE_KINDS = ['fence', 'hay', 'knife', 'oven', 'mud'];

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function createWorld(random) {
  const turkey = {
    lane: 1, targetLane: 1, y: LANES[1], vy: 0, jumping: false,
    width: TURKEY.width, height: TURKEY.height, invulnerable: 0, runPhase: 0, slowTimer: 0,
  };
  const farmer = { x: FARMER.startX };
  const items = [];
  for (let index = 0; index < POOL_SIZE; index += 1) {
    items.push({
      active: false, kind: KIND_OBSTACLE, name: 'fence', lane: 1, x: 0, y: 0,
      width: 0, height: 0, passed: false, points: 0, jumpable: true, stumble: false,
    });
  }
  const state = {
    turkey, farmer, items, score: 0, lives: LIVES, level: 1, elapsed: 0,
    distancePx: 0, metres: 0, speed: SPEED.start, spawnTimer: 0, cornTimer: 0,
    over: false, escaped: false, caught: false, lastEvent: 0,
  };

  function reset() {
    turkey.lane = 1;
    turkey.targetLane = 1;
    turkey.y = LANES[1];
    turkey.vy = 0;
    turkey.jumping = false;
    turkey.invulnerable = 0;
    turkey.runPhase = 0;
    turkey.slowTimer = 0;
    farmer.x = FARMER.startX;
    for (const item of items) item.active = false;
    state.score = 0;
    state.lives = LIVES;
    state.level = 1;
    state.elapsed = 0;
    state.distancePx = 0;
    state.metres = 0;
    state.speed = SPEED.start;
    state.spawnTimer = 1.1;
    state.cornTimer = 0.7;
    state.over = false;
    state.escaped = false;
    state.caught = false;
    state.lastEvent = 0;
  }

  function freeItem() {
    for (let index = 0; index < items.length; index += 1) {
      if (!items[index].active) return items[index];
    }
    return null;
  }

  function spawnObstacle(name, lane, x) {
    const item = freeItem();
    if (item === null) return;
    const spec = OBSTACLE[name];
    item.active = true;
    item.kind = KIND_OBSTACLE;
    item.name = name;
    item.lane = lane;
    item.width = spec.width;
    item.height = spec.height;
    item.x = x;
    item.y = LANES[lane] - spec.height;
    item.passed = false;
    item.points = spec.points;
    item.jumpable = spec.jumpable;
    item.stumble = !!spec.stumble;
  }

  function spawnPickup(kind, lane, x, yOffset) {
    const item = freeItem();
    if (item === null) return;
    const size = kind === KIND_PIE ? PIE.size : CORN.size;
    item.active = true;
    item.kind = kind;
    item.name = kind === KIND_PIE ? 'pie' : kind === KIND_GOLDEN ? 'golden' : 'corn';
    item.lane = lane;
    item.width = size;
    item.height = size;
    item.x = x;
    item.y = LANES[lane] - size - (yOffset || 0);
    item.passed = false;
    item.points = kind === KIND_PIE ? PIE.points : kind === KIND_GOLDEN ? CORN.goldenPoints : CORN.points;
    item.jumpable = false;
    item.stumble = false;
  }

  function spawnInterval() {
    return Math.max(SPAWN.minInterval, SPAWN.interval * SPAWN.intervalScale ** (state.level - 1));
  }

  /** Spawn a wave: block one or two lanes, always leaving a way through. */
  function spawnWave() {
    const lanes = [0, 1, 2];
    // Shuffle the lanes with the seeded random.
    for (let i = lanes.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      const tmp = lanes[i];
      lanes[i] = lanes[j];
      lanes[j] = tmp;
    }
    const blockCount = random() < 0.45 && state.level >= 2 ? 2 : 1;
    const x = FIELD.width + 40 + random() * 120;
    for (let n = 0; n < blockCount; n += 1) {
      const name = OBSTACLE_KINDS[Math.floor(random() * OBSTACLE_KINDS.length)];
      // Stagger the second blocked lane well behind the first: two obstacles at the
      // same x would wall off the farmyard, and nobody could get through.
      spawnObstacle(name, lanes[n], x + n * 260);
    }
    // Sometimes a trail of corn in the free lane rewards the safe choice.
    if (random() < 0.6) {
      const freeLane = lanes[blockCount];
      const kind = random() < CORN.goldenChance ? KIND_GOLDEN : KIND_CORN;
      spawnPickup(kind, freeLane, x + 130, 0);
      if (random() < 0.5) spawnPickup(KIND_CORN, freeLane, x + 180, 0);
    }
  }

  function spawnCornRun() {
    const lane = Math.floor(random() * 3);
    const x = FIELD.width + 40;
    const arc = random() < 0.35;
    for (let n = 0; n < 3; n += 1) {
      const yOffset = arc ? [0, 70, 0][n] : 0;
      spawnPickup(random() < CORN.goldenChance ? KIND_GOLDEN : KIND_CORN, lane, x + n * 52, yOffset);
    }
    if (random() < PIE.chance) spawnPickup(KIND_PIE, Math.floor(random() * 3), x + 220, 60);
  }

  function turkeyBox() {
    const scale = LANE_SCALE[turkey.lane];
    const w = turkey.width * scale;
    const h = turkey.height * scale;
    return { x: TURKEY.x - w / 2, y: turkey.y - h, width: w, height: h };
  }

  /**
   * The lane the turkey is effectively in. On the ground it is the lane line nearest
   * its feet (ties go to the lane it is moving toward); mid-jump it stays in the lane
   * it jumped from, since its feet are above every lane line then. Collisions are
   * lane-based — a tall oven in the lane next door must not catch a turkey running
   * past it, even though its drawing is taller than the gap between lanes.
   */
  function effectiveLane() {
    if (turkey.jumping) return turkey.targetLane;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < LANES.length; i += 1) {
      const dist = Math.abs(LANES[i] - turkey.y);
      if (dist < bestDist || (dist === bestDist && i === turkey.targetLane)) {
        bestDist = dist;
        best = i;
      }
    }
    return best;
  }

  /**
   * One fixed step. `laneDir` is -1 (up a lane), 0 or 1 (down a lane); `jump` starts a
   * jump when the turkey is on the ground. With `harmless` set (the title screen's
   * backdrop) the world scrolls but nothing touches the player and nothing scores.
   */
  function step(dt, laneDir, jump, harmless) {
    let events = 0;
    state.elapsed += dt;
    state.level = Math.min(LEVEL.max, 1 + Math.floor(state.metres / LEVEL.metres));
    state.speed = Math.min(SPEED.max, SPEED.start + SPEED.perLevel * (state.level - 1));
    const speed = turkey.slowTimer > 0 ? state.speed * 0.55 : state.speed;
    state.distancePx += speed * dt;
    state.metres = state.distancePx * METRES_PER_PX;
    if (!harmless) state.score += (speed * dt * METRES_PER_PX) / 5;

    // Lane switching glides the turkey toward the target lane's line.
    if (laneDir !== 0) {
      turkey.targetLane = Math.min(2, Math.max(0, turkey.targetLane + laneDir));
    }
    if (!turkey.jumping) {
      const target = LANES[turkey.targetLane];
      const diff = target - turkey.y;
      turkey.y += Math.max(-520 * dt, Math.min(520 * dt, diff));
      if (Math.abs(diff) < 1) {
        turkey.y = target;
        turkey.lane = turkey.targetLane;
      }
    }
    // Jump physics: Space flaps the turkey up; gravity brings it back down.
    if (jump && !turkey.jumping && !harmless) {
      turkey.jumping = true;
      turkey.vy = TURKEY.jumpVelocity;
    }
    if (turkey.jumping) {
      turkey.vy -= TURKEY.gravity * dt;
      turkey.y -= turkey.vy * dt;
      const ground = LANES[turkey.targetLane];
      if (turkey.y >= ground) {
        turkey.y = ground;
        turkey.jumping = false;
        turkey.vy = 0;
        turkey.lane = turkey.targetLane;
      }
    }
    turkey.runPhase += dt * (speed / 28);
    if (turkey.invulnerable > 0) turkey.invulnerable = Math.max(0, turkey.invulnerable - dt);
    if (turkey.slowTimer > 0) turkey.slowTimer = Math.max(0, turkey.slowTimer - dt);

    // The farmer gains on every mistake and falls back when the turkey runs clean.
    if (!harmless) {
      farmer.x = Math.max(FARMER.startX - 30, farmer.x - FARMER.recoverPerSecond * dt);
      if (farmer.x >= TURKEY.x - FARMER.catchGap) {
        state.over = true;
        state.caught = true;
        return EVENT_OVER;
      }
    }

    // Spawning.
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      spawnWave();
      state.spawnTimer += spawnInterval() * (0.85 + random() * 0.4);
    }
    state.cornTimer -= dt;
    if (state.cornTimer <= 0) {
      spawnCornRun();
      state.cornTimer += SPAWN.cornInterval * (0.8 + random() * 0.7);
    }

    // Move everything left; check collisions and dodge points.
    const box = turkeyBox();
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (!item.active) continue;
      item.x -= speed * dt;
      if (item.x + item.width < -160) {
        item.active = false;
        continue;
      }
      if (!item.passed && item.x + item.width < TURKEY.x - turkey.width / 2) {
        item.passed = true;
        if (item.kind === KIND_OBSTACLE && !harmless) state.score += item.points;
      }
      if (harmless || turkey.invulnerable > 0) continue;
      if (item.lane !== effectiveLane()) continue;
      const itemBox = { x: item.x, y: item.y, width: item.width, height: item.height };
      if (!overlaps(box, itemBox)) continue;
      if (item.kind === KIND_OBSTACLE) {
        if (item.stumble) {
          // Mud: no life lost, but the farmer closes in and the turkey slows.
          farmer.x += FARMER.gainOnStumble;
          turkey.slowTimer = 0.9;
          turkey.invulnerable = 0.9;
          item.active = false;
          events |= EVENT_STUMBLE;
        } else if (item.jumpable && turkey.jumping && box.y + box.height <= item.y + 14) {
          // Cleared it mid-jump: no hit (the box test already accounts for height,
          // this keeps a generous landing window).
          continue;
        } else {
          state.lives -= 1;
          turkey.invulnerable = TURKEY.invulnerable;
          farmer.x += FARMER.gainOnHit;
          item.active = false;
          events |= EVENT_HIT;
          if (state.lives <= 0) {
            state.over = true;
            state.caught = true;
            return events | EVENT_OVER;
          }
        }
      } else {
        state.score += item.points;
        item.active = false;
        events |= EVENT_CORN;
      }
    }

    // The forest: reach the goal and the turkey is free.
    if (!harmless && !state.over && state.metres >= GOAL_METRES) {
      state.over = true;
      state.escaped = true;
      return events | EVENT_ESCAPED;
    }
    state.lastEvent = events;
    return events;
  }

  reset();
  return { state, reset, step, turkeyBox };
}
