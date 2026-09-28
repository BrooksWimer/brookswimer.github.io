import { analyze, move, mulberry32, newGame, spawnTile } from "../shared/2048-engine.js";
import { createLedView } from "../led-view.js";
import { renderPixels } from "./render.js";

const view = createLedView(document.querySelector("canvas"));
const args = new URLSearchParams(location.search);
let seed = Number(args.get("seed") || 2048) >>> 0;
let random, board, score, turn, round = 1, ended = false, paused = false;
let mode = args.get("mode") === "pixel" ? "pixel" : "led";
let lastMove = performance.now();

function reset(nextSeed = seed) {
  seed = nextSeed >>> 0;
  random = mulberry32(seed);
  board = newGame(random);
  score = 0; turn = 0; ended = false;
  lastMove = performance.now();
}
reset();

function step(now) {
  if (ended) { round++; reset((seed + 1) >>> 0); return; }
  const choice = analyze(board, 3).direction;
  if (!choice) { ended = true; lastMove = now; return; }
  const result = move(board, choice);
  board = spawnTile(result.board, random);
  score += result.gained;
  turn++;
  lastMove = now;
}

function frame(now) {
  if (!paused && now - lastMove > (ended ? 2400 : 1100)) step(now);
  view.draw(renderPixels(board), mode);
  document.title = `2048 · round ${round} · move ${turn} · score ${score}${paused ? " · paused" : ""}`;
  requestAnimationFrame(frame);
}
addEventListener("keydown", event => {
  if (["Space", "KeyR", "KeyN", "KeyD"].includes(event.code)) event.preventDefault();
  if (event.code === "Space") paused = !paused;
  if (event.code === "KeyR") reset();
  if (event.code === "KeyN") { round++; reset((seed + 1) >>> 0); }
  if (event.code === "KeyD") mode = mode === "led" ? "pixel" : "led";
});
requestAnimationFrame(frame);
