export const SIZE = 96;
const DIRECTIONS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
const STARTS = [
  { x: 20, y: 23, dir: 0 },
  { x: 76, y: 34, dir: 4 },
  { x: 47, y: 76, dir: 6 }
];

function random(state) {
  state.rng = (Math.imul(state.rng, 1664525) + 1013904223) >>> 0;
  return state.rng / 4294967296;
}

function startSnake(id) {
  const start = STARTS[id];
  const [dx, dy] = DIRECTIONS[start.dir];
  return {
    id, dir: start.dir, goal: 11, points: 0,
    body: Array.from({ length: 11 }, (_, i) => ({ x: start.x - dx * i, y: start.y - dy * i }))
  };
}

function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function valid(p) { return p.x >= 2 && p.x <= 93 && p.y >= 2 && p.y <= 93; }

function occupied(state, point, self = null) {
  return state.snakes.some(snake => {
    // The head and neck are adjacent to the next legal step, not collisions.
    const body = snake === self ? snake.body.slice(2, -2) : snake.body;
    return body.some(part => distance(point, part) < 2.2);
  });
}

function addFood(state) {
  for (let i = 0; i < 120; i++) {
    const point = { x: 4 + Math.floor(random(state) * 88), y: 4 + Math.floor(random(state) * 88) };
    if (!occupied(state, point) && !state.food.some(food => distance(food, point) < 4)) {
      state.food.push(point);
      return true;
    }
  }
  return false;
}

export function createGame(seed = 271828) {
  const state = {
    seed: seed >>> 0, rng: seed >>> 0, tick: 0, collisions: 0,
    snakes: [0, 1, 2].map(startSnake), food: [], events: []
  };
  for (let i = 0; i < 24; i++) addFood(state);
  return state;
}

export function decide(state, snake) {
  const head = snake.body[0];
  let best = null, value = -Infinity;
  for (const turn of [-1, 0, 1]) {
    const direction = (snake.dir + turn + 8) % 8;
    const [dx, dy] = DIRECTIONS[direction];
    const next = { x: head.x + dx, y: head.y + dy };
    if (!valid(next) || occupied(state, next, snake)) continue;
    const nearest = state.food.reduce((min, food) => Math.min(min, distance(next, food)), 120);
    const wall = Math.min(next.x - 2, 93 - next.x, next.y - 2, 93 - next.y);
    const rival = state.snakes.filter(other => other !== snake)
      .reduce((penalty, other) => penalty + Math.max(0, 8 - distance(next, other.body[0])) * 1.7, 0);
    const score = -nearest * 0.55 - rival - Math.max(0, 5 - wall) * 2 - (turn ? 0.35 : 0);
    if (score > value) { value = score; best = { direction, next }; }
  }
  return best;
}

export function stepGame(previous) {
  const state = structuredClone(previous);
  state.tick++;
  state.events = [];
  for (const snake of state.snakes) {
    const action = decide(state, snake);
    if (!action) {
      state.snakes[snake.id] = startSnake(snake.id);
      state.collisions++;
      state.events.push({ type: "reset", snake: snake.id });
      continue;
    }
    snake.dir = action.direction;
    snake.body.unshift(action.next);
    const eaten = state.food.findIndex(food => distance(action.next, food) < 2);
    if (eaten >= 0) {
      state.food.splice(eaten, 1);
      snake.goal += 3;
      snake.points++;
      state.events.push({ type: "eat", snake: snake.id, points: snake.points });
      addFood(state);
    }
    while (snake.body.length > snake.goal) snake.body.pop();
  }
  if (state.tick % 6 === 0 && state.food.length < 26) addFood(state);
  return state;
}
