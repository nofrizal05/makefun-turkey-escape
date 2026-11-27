# Gobble & Go — The Great Turkey Escape

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/nofrizal05/makefun-turkey-escape/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/nofrizal05/makefun-turkey-escape/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

A complete, original turkey escape game that plays offline in a desktop browser. It is Thanksgiving morning and the farmer is coming for you — run 1200 metres through the farmyard, dodge the oven and the carving knife, jump the fences, grab the corn, and reach the forest before he catches you.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — no build step, no network requests, no libraries. The game is plain static files under `game/`.

## How to escape

- **↑ / ↓ or W / S** — switch lane (three lanes through the farmyard)
- **SPACE** — jump / flap over fences, hay bales and carving knives
- **P** — pause, **M** — mute, **Enter** or click — start / restart

## The escape

1. The farmer chases from behind — every hit and every mud puddle lets him close in. Three hits and dinner is served.
2. Fences, hay bales and knives can be jumped; the oven is too tall — change lane. Mud only trips you up, but the farmer loves that.
3. Corn is +10, golden corn +25, a slice of pumpkin pie +50. Dodging obstacles scores too.
4. Every 150 m the farm gets faster and busier (10 levels). Reach 1200 m and the forest — and freedom — is yours.

The HUD shows score, best score, a progress bar from the farmhouse to the forest, lives, and level. Deterministic screenshot scenes are available at `?shot=start|play|end|escape&seed=1`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=31w76kz9&utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01) · AI agents build software for cash rewards</sub>
