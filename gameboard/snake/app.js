import { createGame, stepGame } from "./engine.js";
import { renderPixels } from "./render.js";
import { createLedView } from "../led-view.js";

const view = createLedView(document.querySelector("canvas"));
const args = new URLSearchParams(location.search);
let seed = Number(args.get("seed") || 271828) >>> 0;
let state = createGame(seed), paused = false;
let mode = args.get("mode") === "pixel" ? "pixel" : "led";
let lastTick = performance.now();

function frame(now) {
  if (!paused && now - lastTick >= 145) {
    state = stepGame(state);
    lastTick = now;
  }
  view.draw(renderPixels(state), mode);
  document.title = `Snake arena · step ${state.tick} · food ${state.food.length} · resets ${state.collisions}${paused ? " · paused" : ""}`;
  requestAnimationFrame(frame);
}
addEventListener("keydown", event => {
  if (["Space", "KeyR", "KeyN", "KeyD"].includes(event.code)) event.preventDefault();
  if (event.code === "Space") paused = !paused;
  if (event.code === "KeyR") state = createGame(seed);
  if (event.code === "KeyN") { seed = (seed + 1) >>> 0; state = createGame(seed); }
  if (event.code === "KeyD") mode = mode === "led" ? "pixel" : "led";
  lastTick = performance.now();
});
requestAnimationFrame(frame);
