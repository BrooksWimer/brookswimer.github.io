export const DIRECTIONS = ["up", "right", "down", "left"];

export function mulberry32(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

export function emptyBoard() {
  return Array(16).fill(0);
}

export function emptyCells(board) {
  const cells = [];
  board.forEach((value, index) => {
    if (value === 0) cells.push(index);
  });
  return cells;
}

export function spawnTile(board, random = Math.random) {
  const empty = emptyCells(board);
  if (!empty.length) return board.slice();
  const next = board.slice();
  const index = empty[Math.floor(random() * empty.length)];
  next[index] = random() < 0.9 ? 2 : 4;
  return next;
}

export function newGame(random = Math.random) {
  return spawnTile(spawnTile(emptyBoard(), random), random);
}

function coordinates(direction, line, position) {
  if (direction === "left") return [line, position];
  if (direction === "right") return [line, 3 - position];
  if (direction === "up") return [position, line];
  return [3 - position, line];
}

function collapse(values) {
  const compact = values.filter(Boolean);
  const result = [];
  let gained = 0;
  for (let index = 0; index < compact.length; index += 1) {
    if (compact[index] === compact[index + 1]) {
      const merged = compact[index] * 2;
      result.push(merged);
      gained += merged;
      index += 1;
    } else {
      result.push(compact[index]);
    }
  }
  while (result.length < 4) result.push(0);
  return { values: result, gained };
}

export function move(board, direction) {
  const next = Array(16).fill(0);
  let gained = 0;
  for (let line = 0; line < 4; line += 1) {
    const values = [];
    for (let position = 0; position < 4; position += 1) {
      const [row, column] = coordinates(direction, line, position);
      values.push(board[row * 4 + column]);
    }
    const collapsed = collapse(values);
    gained += collapsed.gained;
    collapsed.values.forEach((value, position) => {
      const [row, column] = coordinates(direction, line, position);
      next[row * 4 + column] = value;
    });
  }
  const moved = next.some((value, index) => value !== board[index]);
  return { board: next, moved, gained };
}

export function legalMoves(board) {
  return DIRECTIONS.filter((direction) => move(board, direction).moved);
}

export function isGameOver(board) {
  return legalMoves(board).length === 0;
}

function log2(value) {
  return value ? Math.log2(value) : 0;
}

export function evaluate(board) {
  const empties = emptyCells(board).length;
  const largest = Math.max(...board);
  let smoothness = 0;
  let monotonicity = 0;
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      const index = row * 4 + column;
      const value = log2(board[index]);
      if (column < 3 && board[index + 1]) smoothness -= Math.abs(value - log2(board[index + 1]));
      if (row < 3 && board[index + 4]) smoothness -= Math.abs(value - log2(board[index + 4]));
      if (column < 3) monotonicity += value >= log2(board[index + 1]) ? 1 : -1;
      if (row < 3) monotonicity += value >= log2(board[index + 4]) ? 1 : -1;
    }
  }
  const corner = [0, 3, 12, 15].some((index) => board[index] === largest) ? log2(largest) * 9 : 0;
  return empties * 32 + smoothness * 3 + monotonicity + corner + log2(largest) * 4;
}

function chanceScore(board, depth) {
  if (depth <= 0) return evaluate(board);
  const empty = emptyCells(board);
  if (!empty.length) return searchScore(board, depth - 1);
  const sampleCount = Math.min(5, empty.length);
  let total = 0;
  for (let sample = 0; sample < sampleCount; sample += 1) {
    const position = empty[Math.floor((sample * empty.length) / sampleCount)];
    for (const [value, probability] of [[2, 0.9], [4, 0.1]]) {
      const future = board.slice();
      future[position] = value;
      total += probability * searchScore(future, depth - 1);
    }
  }
  return total / sampleCount;
}

function searchScore(board, depth) {
  const options = legalMoves(board);
  if (!options.length) return -10000;
  if (depth <= 0) return evaluate(board);
  return Math.max(...options.map((direction) => chanceScore(move(board, direction).board, depth)));
}

export function analyze(board, depth = 3) {
  const scores = Object.fromEntries(DIRECTIONS.map((direction) => [direction, null]));
  for (const direction of legalMoves(board)) {
    const result = move(board, direction);
    scores[direction] = result.gained * 2 + chanceScore(result.board, depth - 1);
  }
  const ranked = Object.entries(scores)
    .filter(([, score]) => score !== null)
    .sort((a, b) => b[1] - a[1]);
  return { direction: ranked[0]?.[0] ?? null, scores };
}
