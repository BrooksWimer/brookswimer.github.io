export const SIZE = 96;
const COLUMNS = [8, 21, 34, 47, 60, 73, 86];
const ROWS = [9, 20, 31, 42, 53];

function nextRandom(state) {
  state.rng = (Math.imul(state.rng, 1664525) + 1013904223) >>> 0;
  return state.rng / 4294967296;
}

function makeEnemies() {
  return ROWS.flatMap((y, row) => COLUMNS.map((x, column) => ({ x, y, row, column, alive: true })));
}

export function createGame(seed = 20260927) {
  return {
    seed: seed >>> 0, rng: seed >>> 0, tick: 0, cycle: 1, wave: 1, score: 0,
    phase: "playing", phaseTicks: 0, outcome: null,
    player: { x: 48, y: 88, lives: 3, cooldown: 0, invulnerable: 0 },
    formation: { offset: 0, direction: 1, drop: 0 },
    enemies: makeEnemies(), shots: [], hostileShots: [],
    decision: { targetColumn: 48, move: 0, fire: false, dodging: false },
    events: []
  };
}

export function enemyPosition(state, enemy) {
  return { x: enemy.x + state.formation.offset, y: enemy.y + state.formation.drop };
}

export function decide(state) {
  const alive = state.enemies.filter(enemy => enemy.alive);
  if (!alive.length || state.phase !== "playing") {
    return { targetColumn: state.player.x, move: 0, fire: false, dodging: false };
  }
  let target = alive[0];
  let best = Infinity;
  for (const enemy of alive) {
    const p = enemyPosition(state, enemy);
    const travel = Math.max(0, (state.player.y - p.y) / 2.4);
    const future = Math.max(4, Math.min(92, p.x + state.formation.direction * 0.18 * travel));
    const cost = Math.abs(future - state.player.x) - p.y * 0.12;
    if (cost < best) { best = cost; target = enemy; }
  }
  const p = enemyPosition(state, target);
  const travel = Math.max(0, (state.player.y - p.y) / 2.4);
  let desired = Math.max(4, Math.min(92, p.x + state.formation.direction * 0.18 * travel));
  let dodging = false;
  for (const shot of state.hostileShots) {
    if (shot.y > 63 && shot.y < 89 && Math.abs(shot.x - state.player.x) < 5) {
      desired = Math.max(4, Math.min(92, state.player.x + (shot.x <= state.player.x ? 9 : -9)));
      dodging = true;
      break;
    }
  }
  const delta = desired - state.player.x;
  return { targetColumn: desired, move: Math.abs(delta) < 0.7 ? 0 : Math.sign(delta), fire: !dodging && Math.abs(delta) < 2.7, dodging };
}

function newCycle(state) {
  state.cycle += 1;
  state.wave = 1;
  state.score = 0;
  state.player = { x: 48, y: 88, lives: 3, cooldown: 0, invulnerable: 0 };
  state.formation = { offset: 0, direction: 1, drop: 0 };
  state.enemies = makeEnemies();
  state.shots = [];
  state.hostileShots = [];
  state.phase = "playing";
  state.outcome = null;
  state.events.push({ type: "cycle-start", cycle: state.cycle });
}

function newWave(state) {
  state.wave += 1;
  state.formation = { offset: 0, direction: state.wave % 2 ? 1 : -1, drop: 0 };
  state.enemies = makeEnemies();
  state.shots = [];
  state.hostileShots = [];
  state.phase = "playing";
  state.outcome = null;
  state.events.push({ type: "wave-start", wave: state.wave });
}

export function stepGame(previous) {
  const state = structuredClone(previous);
  state.tick += 1;
  state.events = [];
  if (state.phase === "intermission") {
    state.phaseTicks += 1;
    if (state.phaseTicks >= 38) {
      state.phaseTicks = 0;
      if (state.outcome === "cleared") newWave(state);
      else newCycle(state);
    }
    return state;
  }

  const action = decide(state);
  state.decision = action;
  state.player.x = Math.max(4, Math.min(92, state.player.x + action.move * 0.9));
  state.player.cooldown = Math.max(0, state.player.cooldown - 1);
  state.player.invulnerable = Math.max(0, state.player.invulnerable - 1);
  if (action.fire && state.player.cooldown === 0) {
    state.shots.push({ x: state.player.x, y: 83 });
    state.player.cooldown = 7;
    state.events.push({ type: "player-fire", x: state.player.x });
  }

  state.formation.offset += state.formation.direction * 0.18;
  if (Math.abs(state.formation.offset) > 5) {
    state.formation.offset = Math.sign(state.formation.offset) * 5;
    state.formation.direction *= -1;
    state.formation.drop += 1.4;
    state.events.push({ type: "formation-turn", drop: state.formation.drop });
  }

  for (const shot of state.shots) shot.y -= 2.4;
  for (const shot of state.hostileShots) shot.y += 1.35;
  state.shots = state.shots.filter(shot => shot.y >= -2);
  state.hostileShots = state.hostileShots.filter(shot => shot.y < SIZE + 2);

  if (state.tick % 27 === 0) {
    const alive = state.enemies.filter(enemy => enemy.alive);
    if (alive.length) {
      const enemy = alive[Math.floor(nextRandom(state) * alive.length)];
      const p = enemyPosition(state, enemy);
      state.hostileShots.push({ x: p.x, y: p.y + 3 });
      state.events.push({ type: "hostile-fire", x: p.x });
    }
  }

  for (const shot of state.shots) {
    for (const enemy of state.enemies) {
      if (!enemy.alive) continue;
      const p = enemyPosition(state, enemy);
      if (Math.abs(shot.x - p.x) <= 3 && Math.abs(shot.y - p.y) <= 3) {
        enemy.alive = false;
        shot.y = -100;
        state.score += 1;
        state.events.push({ type: "hit", column: enemy.column, row: enemy.row });
        break;
      }
    }
  }
  state.shots = state.shots.filter(shot => shot.y >= -2);

  if (state.player.invulnerable === 0) {
    const hit = state.hostileShots.find(shot => Math.abs(shot.x - state.player.x) < 3 && Math.abs(shot.y - state.player.y) < 3);
    if (hit) {
      hit.y = 1000;
      state.player.lives -= 1;
      state.player.invulnerable = 36;
      state.events.push({ type: "player-hit", lives: state.player.lives });
    }
  }
  state.hostileShots = state.hostileShots.filter(shot => shot.y < SIZE + 2);

  if (state.player.lives <= 0 || state.enemies.some(enemy => enemy.alive && enemyPosition(state, enemy).y >= 80)) {
    state.phase = "intermission";
    state.outcome = "lost";
    state.phaseTicks = 0;
    state.events.push({ type: "round-end", outcome: "lost" });
  } else if (state.enemies.every(enemy => !enemy.alive)) {
    state.phase = "intermission";
    state.outcome = "cleared";
    state.phaseTicks = 0;
    state.events.push({ type: "round-end", outcome: "cleared" });
  }
  return state;
}
