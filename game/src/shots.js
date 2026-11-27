// The screenshot scenes behind ?shot=start|play|end|escape. Each one plays the real
// rules forward from a fresh world for a fixed number of steps, steered by a simple
// autopilot, so the frame is what a short game really looks like and the same seed
// always gives the same frame.
import { LANES, STEP, TURKEY } from './config.js';
import { EVENT_ESCAPED, EVENT_OVER, KIND_OBSTACLE } from './world.js';
import { SCREEN_ESCAPED, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 26;
const END_LIMIT_SECONDS = 600;
const ESCAPE_LIMIT_SECONDS = 400;
const SAMPLE = 1 / 30;

/** The nearest obstacle ahead in `lane` (or any lane when lane is -1). An item counts
 * until its right edge has passed the turkey: a wide hay bale at gap -42 still
 * overlaps the turkey, so the gap test uses the item's far edge. */
function nearestObstacle(state, lane, ahead) {
  let best = null;
  for (const item of state.items) {
    if (!item.active || item.kind !== KIND_OBSTACLE) continue;
    if (lane >= 0 && item.lane !== lane) continue;
    const gap = item.x - TURKEY.x;
    if (item.x + item.width < TURKEY.x - 40 || gap > ahead) continue;
    if (best === null || item.x < best.x) best = item;
  }
  return best;
}

/** The lane the turkey is physically in: nearest lane line to its feet (ties go to the
 * lane it is moving toward); mid-jump, the lane it jumped from. Threats must be read
 * in this lane, not the target lane — while the turkey is still crossing the middle
 * lane, that lane is where it can be hit. */
function effectiveLane(state) {
  const turkey = state.turkey;
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

/** A lane is clear when no obstacle sits in it within `ahead` px of the turkey. */
function laneClear(state, lane, ahead) {
  return nearestObstacle(state, lane, ahead) === null;
}

/**
 * A lane can be dodged into when it is clear, or when the only thing in it is a low
 * obstacle far enough away that the turkey can jump it on arrival (it takes ~0.12 s
 * to change lane; a jumpable obstacle more than 280 px out arrives long after that,
 * and the pilot jumps it once it is close).
 */
function laneDodgeable(state, lane, ahead) {
  const obstacle = nearestObstacle(state, lane, ahead);
  return obstacle === null || (obstacle.jumpable && obstacle.x - TURKEY.x > 280);
}

/** The nearest pickup ahead in `lane`. */
function nearestPickup(state, lane, ahead) {
  let best = null;
  for (const item of state.items) {
    if (!item.active || item.kind === KIND_OBSTACLE) continue;
    if (item.lane !== lane) continue;
    const gap = item.x - TURKEY.x;
    if (item.x + item.width < TURKEY.x - 20 || gap > ahead) continue;
    if (best === null || item.x < best.x) best = item;
  }
  return best;
}

/** Can the turkey move from `from` toward `to` without crossing an occupied lane? */
function pathClear(state, from, to) {
  const step = Math.sign(to - from);
  let lane = from;
  while (lane !== to) {
    lane += step;
    if (!laneDodgeable(state, lane, lane === to ? 460 : 300)) return false;
  }
  return true;
}

/**
 * One autopilot decision: { laneDir, jump }. It picks an absolute destination lane
 * each step and steps the committed lane (targetLane) toward it, so a dodge decided
 * while the turkey is still in its old lane can never overshoot into a third lane.
 * The careful pilot jumps low obstacles, changes lane around tall ones and chases
 * corn when the way is clear. The careless pilot (horizon 110) reacts far too late
 * and never jumps, so it gets caught.
 */
function autopilot(state, horizon, careful) {
  const turkey = state.turkey;
  const phys = effectiveLane(state);
  const dest = turkey.targetLane;
  // A threat in the lane the turkey is standing in, else in the lane it is heading to.
  const threat = nearestObstacle(state, phys, horizon) ?? nearestObstacle(state, dest, horizon);
  if (threat !== null) {
    const gap = threat.x - TURKEY.x;
    // Jump late, not early: the turkey must still be airborne when the obstacle's
    // trailing edge passes (a jump at gap 210 lands on a wide hay bale or knife).
    if (careful && threat.jumpable && gap < 150 && !turkey.jumping) return { laneDir: 0, jump: true };
    // Find a clear lane to dodge into, never crossing an occupied lane.
    for (const candidate of [phys - 1, phys + 1, phys - 2, phys + 2]) {
      if (candidate < 0 || candidate > 2) continue;
      if (pathClear(state, phys, candidate)) {
        return { laneDir: Math.sign(candidate - dest), jump: false };
      }
    }
    if (careful && threat.jumpable && gap < 150 && !turkey.jumping) return { laneDir: 0, jump: true };
    return { laneDir: 0, jump: false };
  }
  if (careful) {
    // No threat: drift toward the nearest corn, but only when the way there is
    // clear and nothing is closing in anywhere nearby.
    if (nearestObstacle(state, -1, 500) === null) {
      for (let look = 0; look < 3; look += 1) {
        const pickup = nearestPickup(state, look, 420);
        if (pickup !== null && look !== dest && pathClear(state, phys, look)) {
          return { laneDir: Math.sign(look - dest), jump: false };
        }
      }
    }
    // Corn floating above the lane (an arc over a fence): jump for it — but never
    // spend the jump on corn while an obstacle is closing in on this lane.
    const above = nearestPickup(state, phys, 200);
    if (above !== null && above.y < turkey.y - 60 && !turkey.jumping
      && nearestObstacle(state, phys, 350) === null) {
      return { laneDir: 0, jump: true };
    }
  }
  return { laneDir: 0, jump: false };
}

/**
 * Set `world` to the named scene (start, play, end or escape; any other name is start)
 * and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'end' && name !== 'escape') {
    for (let index = 0; index < START_SECONDS / STEP; index += 1) world.step(STEP, 0, false, true);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  const limit = name === 'end' ? END_LIMIT_SECONDS : name === 'escape' ? ESCAPE_LIMIT_SECONDS : PLAY_SECONDS;
  const careful = name !== 'end';
  const horizon = name === 'end' ? 110 : 340;
  for (let index = 0; index < limit / STEP; index += 1) {
    const move = autopilot(world.state, horizon, careful);
    const events = world.step(STEP, move.laneDir, move.jump, false);
    if (events & EVENT_OVER) break;
    if (events & EVENT_ESCAPED) break;
  }
  const over = world.state.over;
  const screen = world.state.escaped ? SCREEN_ESCAPED : over ? SCREEN_OVER : SCREEN_PLAY;
  return { screen, best: Math.floor(world.state.score) };
}
