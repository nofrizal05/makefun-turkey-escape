// Every tuning number and colour in one place. The playfield is a fixed 1280x720 logical
// area; the renderer scales it to the window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 720, groundY: 690 };

// Three running lanes: the turkey's feet rest on the lane line. Lane 0 is the back
// (smallest, highest on screen), lane 2 the front (biggest, lowest).
export const LANES = [548, 612, 676];
export const LANE_SCALE = [0.82, 0.92, 1.0];

export const STEP = 1 / 60;

export const TURKEY = {
  x: 230,
  width: 64,
  height: 62,
  jumpVelocity: 620,
  gravity: 1700,
  invulnerable: 1.6,
};

export const FARMER = {
  startX: 64,
  gainOnHit: 62,
  gainOnStumble: 34,
  recoverPerSecond: 11,
  catchGap: 46,
};

export const LIVES = 3;

// The forest — the escape — is this far away, in metres.
export const GOAL_METRES = 1200;
export const METRES_PER_PX = 1 / 42;

export const SPEED = { start: 380, perLevel: 26, max: 760 };

export const SPAWN = {
  interval: 0.95,
  intervalScale: 0.9,
  minInterval: 0.42,
  cornInterval: 1.15,
};

// Seconds of running per level; speeds and spawn rates stop growing at the last level.
export const LEVEL = { metres: 150, max: 10 };

// Obstacle kinds. Fence and hay are low: jump them. The oven is tall: change lane.
// The knife lies across a lane: jump it or change lane. Mud only trips you up.
export const OBSTACLE = {
  fence: { width: 46, height: 58, jumpable: true, points: 5 },
  hay: { width: 64, height: 52, jumpable: true, points: 5 },
  knife: { width: 78, height: 30, jumpable: true, points: 10 },
  oven: { width: 84, height: 148, jumpable: false, points: 15 },
  mud: { width: 96, height: 18, jumpable: false, points: 0, stumble: true },
};

export const CORN = { size: 30, points: 10, goldenPoints: 25, goldenChance: 0.16 };
export const PIE = { size: 34, points: 50, chance: 0.05 };

export const POOL_SIZE = 72;

export const PALETTE = {
  skyTop: '#f7b267',
  skyMid: '#f4845f',
  skyLow: '#ffd6a5',
  sun: '#fff3b0',
  cloud: 'rgba(255, 244, 224, 0.85)',
  hillFar: '#8a9a5b',
  hillNear: '#6b8e4e',
  ground: '#7fae5a',
  groundDark: '#6b9a4a',
  dirt: '#a9805a',
  barn: '#b3402f',
  barnRoof: '#7c2d20',
  tree: '#2f6b33',
  treeDark: '#245426',
  trunk: '#6b4a2f',
  turkeyBody: '#8a5a2b',
  turkeyDark: '#6e451f',
  turkeyLight: '#b07a3e',
  tail: ['#a0522d', '#d2691e', '#e8a33c', '#7a3b1e', '#c97b2d'],
  head: '#dfe6ee',
  beak: '#f2a541',
  wattle: '#e5534b',
  leg: '#e8a33c',
  farmerShirt: '#c0392b',
  farmerHat: '#e8c85a',
  farmerSkin: '#f0c8a0',
  farmerPants: '#2f4d6d',
  oven: '#5d6d7e',
  ovenDark: '#3e4a57',
  fire: '#ff9f1c',
  knife: '#d7dce3',
  knifeEdge: '#f4f6f8',
  handle: '#5a3a22',
  corn: '#f2c94c',
  cornHusk: '#4e9b47',
  pie: '#e07840',
  panel: 'rgba(20, 16, 10, 0.72)',
  text: '#fff8ec',
  muted: '#ffd9a0',
  danger: '#ff5a4e',
  gold: '#ffd700',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'gobble-and-go.best';
