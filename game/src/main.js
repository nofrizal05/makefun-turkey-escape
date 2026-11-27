// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s
// steps (several in a slow frame, none in a fast one), and the renderer paints what is
// there. The game moves between five screens: title, play, paused, caught and escaped.
//
// ?seed=N fixes the spawn pattern. ?shot=start|play|end|escape (with &seed=N) stages
// that scene instead of running the loop, paints it twice and sets window.__shotReady
// for a screenshot.
import { BEST_KEY, LIVES, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_CORN, EVENT_ESCAPED, EVENT_HIT, EVENT_OVER, EVENT_STUMBLE } from './world.js';
import { ACTION_CONFIRM, ACTION_JUMP, ACTION_MUTE, ACTION_PAUSE, createInput } from './input.js';
import { createRenderer, SCREEN_ESCAPED, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { createSound } from './sound.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const sound = createSound();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let prevLaneDir = 0;

  // Screen readers (and anyone watching the page's text) hear the screen changes and each hit.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    prevLaneDir = 0;
    screen = SCREEN_PLAY;
    sound.unlock();
    sound.click();
    announce(`Playing. ${LIVES} lives. Run ${1200} metres to the forest!`);
  }

  function endGame(escaped) {
    screen = escaped ? SCREEN_ESCAPED : SCREEN_OVER;
    if (world.state.score > best) {
      best = Math.floor(world.state.score);
      saveBest(best);
    }
    if (escaped) {
      sound.escaped();
      announce(`Escaped! Score ${Math.floor(world.state.score)}. Best ${best}.`);
    } else {
      sound.caught();
      announce(`Caught. Score ${Math.floor(world.state.score)}. Best ${best}.`);
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const muted = sound.toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
    // Space starts the game too (the title screen says so); Enter or a click also works.
    if (actions & (ACTION_CONFIRM | ACTION_JUMP)
      && (screen === SCREEN_TITLE || screen === SCREEN_OVER || screen === SCREEN_ESCAPED)) {
      startGame();
    } else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM | ACTION_JUMP) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
    return actions;
  }

  function step(actions, firstStepOfFrame) {
    if (screen === SCREEN_TITLE) {
      world.step(STEP, 0, false, true);
      return;
    }
    // Lane switches are edge-triggered: holding Up moves one lane, not all three.
    const held = input.laneDirection();
    let laneDir = 0;
    if (held !== 0 && prevLaneDir === 0 && firstStepOfFrame) laneDir = held;
    prevLaneDir = held;
    const jump = firstStepOfFrame && (actions & ACTION_JUMP) !== 0;
    if (jump) sound.jump();
    const events = world.step(STEP, laneDir, jump, false);
    if (events & EVENT_CORN) sound.corn();
    if (events & EVENT_STUMBLE) {
      sound.stumble();
      announce('Mud! The farmer is closing in!');
    }
    if (events & EVENT_HIT) {
      sound.hit();
      announce(world.state.lives === 1 ? 'Hit. 1 life left.' : `Hit. ${world.state.lives} lives left.`);
    }
    if (events & EVENT_OVER) endGame(false);
    else if (events & EVENT_ESCAPED) endGame(true);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    const actions = handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      let first = true;
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step(actions, first);
        first = false;
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best);
  }

  // Leaving the tab pauses a running game rather than letting the farmer catch up unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Gobble and Go. Press Space or click to run.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
