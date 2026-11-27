// All drawing: a dawn farmyard in parallax, the running turkey, the chasing farmer,
// the obstacles and pickups, the HUD, and the title / paused / caught / escaped screens.
// The canvas is a fixed 1280x720 logical area scaled to the window.
import { FIELD, FONT, GOAL_METRES, LANE_SCALE, LANES, PALETTE, TURKEY } from './config.js';

export const SCREEN_TITLE = 0;
export const SCREEN_PLAY = 1;
export const SCREEN_PAUSED = 2;
export const SCREEN_OVER = 3;
export const SCREEN_ESCAPED = 4;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = FIELD.width * dpr;
    canvas.height = FIELD.height * dpr;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
  }
  resize();
  window.addEventListener('resize', resize);

  function drawBackground(state) {
    const d = state.distancePx;
    const progress = Math.min(1, state.metres / GOAL_METRES);
    // Dawn sky: warm near the barn, cooling toward the forest as the run goes on.
    const sky = ctx.createLinearGradient(0, 0, 0, FIELD.height);
    sky.addColorStop(0, PALETTE.skyTop);
    sky.addColorStop(0.55, PALETTE.skyMid);
    sky.addColorStop(1, PALETTE.skyLow);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    // Sun.
    ctx.fillStyle = PALETTE.sun;
    ellipse(ctx, 1060 - progress * 120, 110, 52, 52);
    ctx.fillStyle = 'rgba(255, 243, 176, 0.35)';
    ellipse(ctx, 1060 - progress * 120, 110, 74, 74);
    // Clouds drift slowly.
    ctx.fillStyle = PALETTE.cloud;
    for (let i = 0; i < 5; i += 1) {
      const cx = ((i * 340 - d * 0.12) % 1500 + 1500) % 1500 - 110;
      const cy = 60 + i * 34;
      ellipse(ctx, cx, cy, 62, 18);
      ellipse(ctx, cx + 38, cy + 6, 46, 14);
    }
    // Far hills.
    ctx.fillStyle = PALETTE.hillFar;
    ctx.beginPath();
    ctx.moveTo(0, 520);
    for (let x = 0; x <= FIELD.width; x += 80) {
      ctx.lineTo(x, 500 + Math.sin((x + d * 0.2) * 0.006) * 26);
    }
    ctx.lineTo(FIELD.width, FIELD.height);
    ctx.lineTo(0, FIELD.height);
    ctx.closePath();
    ctx.fill();
    // The barn shrinks behind as the turkey runs; the forest grows ahead.
    const barnX = 120 - d * 0.55;
    if (barnX > -260) drawBarn(barnX, 470);
    drawTreeLine(d, progress);
    // Near hill.
    ctx.fillStyle = PALETTE.hillNear;
    ctx.beginPath();
    ctx.moveTo(0, 580);
    for (let x = 0; x <= FIELD.width; x += 80) {
      ctx.lineTo(x, 566 + Math.sin((x + d * 0.35) * 0.008) * 14);
    }
    ctx.lineTo(FIELD.width, FIELD.height);
    ctx.lineTo(0, FIELD.height);
    ctx.closePath();
    ctx.fill();
    // Ground.
    ctx.fillStyle = PALETTE.ground;
    ctx.fillRect(0, 596, FIELD.width, FIELD.height - 596);
    ctx.fillStyle = PALETTE.groundDark;
    ctx.fillRect(0, 596, FIELD.width, 6);
    // Dirt track the turkey runs on.
    ctx.fillStyle = PALETTE.dirt;
    ctx.fillRect(0, 640, FIELD.width, 80);
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (let i = 0; i < 12; i += 1) {
      const gx = ((i * 173 - d) % 1400 + 1400) % 1400 - 60;
      ellipse(ctx, gx, 668 + (i % 3) * 16, 26, 5);
    }
    // Fence posts scrolling past.
    ctx.fillStyle = PALETTE.trunk;
    const postGap = 150;
    const offset = d % postGap;
    for (let x = -offset; x < FIELD.width + postGap; x += postGap) {
      ctx.fillRect(x, 556, 8, 44);
      ctx.fillRect(x + 3, 550, 2, 6);
    }
    ctx.fillStyle = 'rgba(107, 74, 47, 0.8)';
    ctx.fillRect(0, 566, FIELD.width, 4);
    ctx.fillRect(0, 582, FIELD.width, 4);
    // Lane guides, faint.
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 2;
    ctx.setLineDash([14, 18]);
    for (const laneY of LANES) {
      ctx.beginPath();
      ctx.moveTo(0, laneY + 4);
      ctx.lineTo(FIELD.width, laneY + 4);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  function drawBarn(x, y) {
    ctx.fillStyle = PALETTE.barn;
    ctx.fillRect(x, y, 190, 120);
    ctx.fillStyle = PALETTE.barnRoof;
    ctx.beginPath();
    ctx.moveTo(x - 12, y);
    ctx.lineTo(x + 95, y - 62);
    ctx.lineTo(x + 202, y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f5e6c8';
    ctx.fillRect(x + 72, y + 58, 46, 62);
    ctx.strokeStyle = '#7c2d20';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 72, y + 58);
    ctx.lineTo(x + 118, y + 120);
    ctx.moveTo(x + 118, y + 58);
    ctx.lineTo(x + 72, y + 120);
    ctx.stroke();
    ctx.fillStyle = '#fff3b0';
    ctx.fillRect(x + 22, y + 22, 26, 26);
    ctx.fillRect(x + 142, y + 22, 26, 26);
  }

  function drawTreeLine(d, progress) {
    // Trees thicken as the turkey nears the forest: the escape you can see.
    const count = 4 + Math.floor(progress * 10);
    for (let i = 0; i < count; i += 1) {
      const spacing = 190;
      const tx = ((i * spacing + 900 - d * 0.75) % 1500 + 1500) % 1500 - 110;
      const size = 0.8 + ((i * 37) % 50) / 100 + progress * 0.35;
      const baseY = 596 - ((i * 53) % 40);
      ctx.fillStyle = PALETTE.trunk;
      ctx.fillRect(tx - 5 * size, baseY - 34 * size, 10 * size, 34 * size);
      ctx.fillStyle = i % 2 ? PALETTE.tree : PALETTE.treeDark;
      ellipse(ctx, tx, baseY - 52 * size, 34 * size, 42 * size);
      ellipse(ctx, tx - 20 * size, baseY - 30 * size, 22 * size, 26 * size);
      ellipse(ctx, tx + 20 * size, baseY - 30 * size, 22 * size, 26 * size);
    }
  }

  function drawTurkey(turkey, state) {
    const scale = LANE_SCALE[turkey.lane];
    const x = TURKEY.x;
    const feetY = turkey.y;
    const s = scale * (turkey.jumping ? 1.04 : 1);
    const bob = turkey.jumping ? 0 : Math.sin(turkey.runPhase) * 2.5;
    if (turkey.invulnerable > 0 && Math.floor(state.elapsed * 12) % 2 === 0) return; // blink
    ctx.save();
    ctx.translate(x, feetY + bob);
    ctx.scale(s, s);
    // Tail fan.
    for (let i = 0; i < 5; i += 1) {
      const angle = (-58 + i * 29) * (Math.PI / 180);
      ctx.save();
      ctx.rotate(angle);
      ctx.fillStyle = PALETTE.tail[i];
      ctx.beginPath();
      ctx.ellipse(-26, -8, 20, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Legs, mid-stride.
    const stride = Math.sin(turkey.runPhase * 2) * 9;
    ctx.strokeStyle = PALETTE.leg;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6, -12);
    ctx.lineTo(-6 + stride, 0);
    ctx.moveTo(6, -12);
    ctx.lineTo(6 - stride, 0);
    ctx.stroke();
    // Body.
    ctx.fillStyle = PALETTE.turkeyBody;
    ellipse(ctx, 0, -30, 30, 24);
    ctx.fillStyle = PALETTE.turkeyLight;
    ellipse(ctx, 6, -26, 20, 16);
    // Wing (flaps up while jumping).
    ctx.fillStyle = PALETTE.turkeyDark;
    ctx.save();
    ctx.translate(-4, -30);
    ctx.rotate(turkey.jumping ? -0.9 : Math.sin(turkey.runPhase * 2) * 0.16);
    ctx.beginPath();
    ctx.ellipse(-8, 0, 18, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Head and beak, facing right — toward the forest.
    ctx.fillStyle = PALETTE.head;
    ellipse(ctx, 26, -56, 13, 12);
    ctx.fillStyle = PALETTE.beak;
    ctx.beginPath();
    ctx.moveTo(36, -58);
    ctx.lineTo(50, -54);
    ctx.lineTo(36, -51);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.wattle;
    ellipse(ctx, 32, -46, 4, 7);
    ctx.fillStyle = '#1c1c1c';
    ellipse(ctx, 29, -59, 2.4, 2.4);
    ctx.restore();
  }

  function drawFarmer(state) {
    const turkey = state.turkey;
    const scale = LANE_SCALE[turkey.lane] * 1.12;
    const feetY = LANES[turkey.lane];
    const x = state.farmer.x;
    const bob = Math.abs(Math.sin(turkey.runPhase * 1.4)) * -4;
    const close = TURKEY.x - x < 170;
    ctx.save();
    ctx.translate(x, feetY + bob);
    ctx.scale(scale, scale);
    // Legs.
    const stride = Math.sin(turkey.runPhase * 2.4) * 11;
    ctx.strokeStyle = PALETTE.farmerPants;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6, -26);
    ctx.lineTo(-6 + stride, 0);
    ctx.moveTo(6, -26);
    ctx.lineTo(6 - stride, 0);
    ctx.stroke();
    // Body: red plaid shirt.
    ctx.fillStyle = PALETTE.farmerShirt;
    roundRect(ctx, -18, -58, 36, 34, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-18, -46);
    ctx.lineTo(18, -46);
    ctx.moveTo(-18, -34);
    ctx.lineTo(18, -34);
    ctx.stroke();
    // Reaching arm.
    ctx.strokeStyle = PALETTE.farmerSkin;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(10, -50);
    ctx.lineTo(34, -44 + Math.sin(turkey.runPhase * 2.4) * 4);
    ctx.stroke();
    // Head, moustache, angry eyes.
    ctx.fillStyle = PALETTE.farmerSkin;
    ellipse(ctx, 2, -70, 13, 13);
    ctx.fillStyle = '#5a3a22';
    ctx.fillRect(-6, -64, 16, 4);
    ctx.fillStyle = '#1c1c1c';
    ellipse(ctx, 6, -73, 2, 2.6);
    // Straw hat.
    ctx.fillStyle = PALETTE.farmerHat;
    ellipse(ctx, 2, -80, 20, 5);
    ctx.beginPath();
    ctx.moveTo(-10, -80);
    ctx.lineTo(-8, -94);
    ctx.lineTo(14, -94);
    ctx.lineTo(12, -80);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    if (close) {
      ctx.fillStyle = PALETTE.danger;
      ctx.font = 'bold 22px ' + FONT;
      ctx.textAlign = 'left';
      ctx.fillText('HE IS RIGHT BEHIND YOU!', 16, 96);
    }
  }

  function drawItem(item) {
    const laneY = LANES[item.lane];
    ctx.save();
    if (item.kind === 0) {
      if (item.name === 'fence') {
        ctx.fillStyle = '#8a6a42';
        ctx.fillRect(item.x, item.y, 8, item.height);
        ctx.fillRect(item.x + item.width - 8, item.y, 8, item.height);
        ctx.fillStyle = '#a9805a';
        ctx.fillRect(item.x - 4, item.y + 8, item.width + 8, 7);
        ctx.fillRect(item.x - 4, item.y + 28, item.width + 8, 7);
      } else if (item.name === 'hay') {
        ctx.fillStyle = '#d9a441';
        ellipse(ctx, item.x + item.width / 2, item.y + item.height / 2, 34, 26);
        ctx.strokeStyle = '#b07f2a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(item.x + item.width / 2, item.y + item.height / 2, 22, 16, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(item.x + item.width / 2, item.y + item.height / 2, 10, 8, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (item.name === 'knife') {
        ctx.save();
        ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
        ctx.rotate(-0.12);
        ctx.fillStyle = PALETTE.knife;
        ctx.beginPath();
        ctx.moveTo(-38, -8);
        ctx.lineTo(22, -8);
        ctx.lineTo(38, 0);
        ctx.lineTo(22, 8);
        ctx.lineTo(-38, 8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = PALETTE.knifeEdge;
        ctx.fillRect(-38, 5, 60, 3);
        ctx.fillStyle = PALETTE.handle;
        roundRect(ctx, -52, -9, 16, 18, 4);
        ctx.fill();
        ctx.restore();
      } else if (item.name === 'oven') {
        ctx.fillStyle = PALETTE.oven;
        roundRect(ctx, item.x, item.y, item.width, item.height, 8);
        ctx.fill();
        ctx.fillStyle = PALETTE.ovenDark;
        roundRect(ctx, item.x + 10, item.y + 52, item.width - 20, 62, 6);
        ctx.fill();
        // Fire glowing in the oven door.
        const flicker = 0.7 + Math.sin(item.x * 0.05) * 0.3;
        ctx.fillStyle = `rgba(255, 159, 28, ${flicker})`;
        ellipse(ctx, item.x + item.width / 2, item.y + 84, 22, 16);
        ctx.fillStyle = '#ff5a1c';
        ellipse(ctx, item.x + item.width / 2, item.y + 90, 12, 9);
        ctx.fillStyle = PALETTE.ovenDark;
        ctx.fillRect(item.x + item.width / 2 - 4, item.y - 26, 8, 26);
        ctx.fillStyle = 'rgba(120,120,120,0.5)';
        ellipse(ctx, item.x + item.width / 2, item.y - 32, 14, 6);
      } else if (item.name === 'mud') {
        ctx.fillStyle = '#6b4a2f';
        ellipse(ctx, item.x + item.width / 2, item.y + 9, item.width / 2, 10);
        ctx.fillStyle = '#8a6a42';
        ellipse(ctx, item.x + item.width / 2 - 14, item.y + 8, 16, 5);
        ellipse(ctx, item.x + item.width / 2 + 18, item.y + 10, 12, 4);
      }
    } else {
      // Pickups: corn, golden corn, pumpkin pie.
      const cx = item.x + item.width / 2;
      const cy = item.y + item.height / 2;
      if (item.name === 'pie') {
        ctx.fillStyle = PALETTE.pie;
        ctx.beginPath();
        ctx.moveTo(cx - 16, cy + 10);
        ctx.lineTo(cx + 16, cy + 10);
        ctx.lineTo(cx, cy - 14);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#f5d7a1';
        ctx.fillRect(cx - 16, cy + 8, 32, 5);
      } else {
        if (item.name === 'golden') {
          ctx.fillStyle = 'rgba(255, 215, 0, 0.35)';
          ellipse(ctx, cx, cy, 24, 24);
        }
        ctx.fillStyle = item.name === 'golden' ? PALETTE.gold : PALETTE.corn;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-0.35);
        ctx.beginPath();
        ctx.ellipse(0, 0, 9, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = PALETTE.cornHusk;
        ctx.beginPath();
        ctx.moveTo(cx - 8, cy + 8);
        ctx.lineTo(cx - 12, cy + 18);
        ctx.lineTo(cx - 2, cy + 14);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + 8, cy + 8);
        ctx.lineTo(cx + 12, cy + 18);
        ctx.lineTo(cx + 2, cy + 14);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawHud(state, best) {
    const progress = Math.min(1, state.metres / GOAL_METRES);
    // Top bar.
    ctx.fillStyle = PALETTE.panel;
    roundRect(ctx, 12, 12, FIELD.width - 24, 56, 12);
    ctx.fill();
    ctx.fillStyle = PALETTE.text;
    ctx.textAlign = 'left';
    ctx.font = 'bold 24px ' + FONT;
    ctx.fillText(`SCORE ${Math.floor(state.score)}`, 28, 40);
    ctx.font = '16px ' + FONT;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(`BEST ${Math.max(best, Math.floor(state.score))}`, 28, 60);
    // Distance to the forest.
    const barX = 330;
    const barW = 560;
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    roundRect(ctx, barX, 26, barW, 14, 7);
    ctx.fill();
    ctx.fillStyle = '#7dd069';
    roundRect(ctx, barX, 26, Math.max(14, barW * progress), 14, 7);
    ctx.fill();
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 15px ' + FONT;
    ctx.textAlign = 'center';
    ctx.fillText('🏠', barX - 14, 40);
    ctx.fillText('🌲', barX + barW + 20, 40);
    ctx.fillText(`${Math.floor(state.metres)} m / ${GOAL_METRES} m to the forest`, barX + barW / 2, 60);
    // Lives and level.
    ctx.textAlign = 'right';
    ctx.font = 'bold 20px ' + FONT;
    ctx.fillStyle = PALETTE.text;
    ctx.fillText(`LEVEL ${state.level}`, FIELD.width - 28, 34);
    ctx.font = '22px ' + FONT;
    let hearts = '';
    for (let i = 0; i < 3; i += 1) hearts += i < state.lives ? '🦃' : '·';
    ctx.fillText(hearts, FIELD.width - 28, 60);
    ctx.textAlign = 'left';
  }

  function panel(x, y, w, h) {
    ctx.fillStyle = 'rgba(20, 14, 8, 0.78)';
    roundRect(ctx, x, y, w, h, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, w, h, 18);
    ctx.stroke();
  }

  function drawTitle(state, best) {
    ctx.fillStyle = 'rgba(20, 10, 4, 0.45)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    panel(290, 96, 700, 470);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 64px ' + FONT;
    ctx.fillText('GOBBLE & GO', 640, 180);
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 28px ' + FONT;
    ctx.fillText('🦃 The Great Turkey Escape 🦃', 640, 224);
    ctx.font = '19px ' + FONT;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText('Thanksgiving morning. The farmer is coming for you.', 640, 262);
    ctx.fillText('Run 1200 m through the farmyard and reach the forest!', 640, 290);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '20px ' + FONT;
    ctx.fillText('↑ / ↓  or  W / S — switch lane', 640, 348);
    ctx.fillText('SPACE — jump over fences, hay and knives', 640, 380);
    ctx.fillText('Dodge the oven — it is too tall to jump!', 640, 412);
    ctx.fillText('Grab corn 🌽 and pie 🥧 · P pauses · M mutes', 640, 444);
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 26px ' + FONT;
    ctx.fillText('Press SPACE or click to run!', 640, 502);
    if (best > 0) {
      ctx.fillStyle = PALETTE.muted;
      ctx.font = '18px ' + FONT;
      ctx.fillText(`Best score: ${best}`, 640, 536);
    }
    ctx.textAlign = 'left';
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(20, 10, 4, 0.55)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    panel(440, 250, 400, 180);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 40px ' + FONT;
    ctx.fillText('PAUSED', 640, 322);
    ctx.font = '20px ' + FONT;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText('Press P or Space to keep running', 640, 366);
    ctx.textAlign = 'left';
  }

  function drawEnd(state, best, escaped) {
    ctx.fillStyle = escaped ? 'rgba(10, 40, 16, 0.55)' : 'rgba(40, 8, 4, 0.55)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    panel(340, 130, 600, 440);
    ctx.textAlign = 'center';
    if (escaped) {
      ctx.fillStyle = '#7dd069';
      ctx.font = 'bold 56px ' + FONT;
      ctx.fillText('ESCAPED!', 640, 210);
      ctx.fillStyle = PALETTE.text;
      ctx.font = '24px ' + FONT;
      ctx.fillText('🌲 You made it to the forest, free as a bird! 🦃', 640, 258);
    } else {
      ctx.fillStyle = PALETTE.danger;
      ctx.font = 'bold 56px ' + FONT;
      ctx.fillText('CAUGHT!', 640, 210);
      ctx.fillStyle = PALETTE.text;
      ctx.font = '24px ' + FONT;
      ctx.fillText('The farmer got you… dinner is served. 🍗', 640, 258);
    }
    ctx.font = '22px ' + FONT;
    ctx.fillStyle = PALETTE.text;
    ctx.fillText(`Score: ${Math.floor(state.score)}   ·   Best: ${Math.max(best, Math.floor(state.score))}`, 640, 322);
    ctx.fillText(`Distance: ${Math.floor(state.metres)} m of ${GOAL_METRES} m   ·   Level ${state.level}`, 640, 358);
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 26px ' + FONT;
    ctx.fillText('Press SPACE or click to run again!', 640, 430);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '18px ' + FONT;
    ctx.fillText('Tip: jump the fences, dodge the oven, outrun the farmer.', 640, 500);
    ctx.textAlign = 'left';
  }

  function draw(state, screen, best) {
    ctx.setTransform(canvas.width / FIELD.width, 0, 0, canvas.height / FIELD.height, 0, 0);
    drawBackground(state);
    // Depth order: the back lanes first, then the farmer and turkey, then the front
    // lanes — so a tall oven in a front lane correctly hides a turkey running behind it.
    const turkeyLane = state.turkey.targetLane;
    for (const item of state.items) {
      if (item.active && item.lane < turkeyLane) drawItem(item);
    }
    if (screen !== SCREEN_TITLE) drawFarmer(state);
    drawTurkey(state.turkey, state);
    for (const item of state.items) {
      if (item.active && item.lane >= turkeyLane) drawItem(item);
    }
    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) drawHud(state, best);
    if (screen === SCREEN_TITLE) drawTitle(state, best);
    else if (screen === SCREEN_PAUSED) drawPaused();
    else if (screen === SCREEN_OVER) drawEnd(state, best, false);
    else if (screen === SCREEN_ESCAPED) drawEnd(state, best, true);
  }

  return { draw };
}
