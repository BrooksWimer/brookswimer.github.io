import { analyze, move, mulberry32, newGame, spawnTile } from "../shared/2048-engine.js";
import { createLedView } from "../led-view.js";
import { motionForMove } from "./motion.js";
import { PALETTE_IDS, PALETTES, TILE_VALUES } from "./palettes.js";
import { renderPixels } from "./render.js";

const site = document.querySelector("#gameboard-2048");
const view = createLedView(site.querySelector("canvas"), 96, site.querySelector(".stage"));
const args = new URLSearchParams(location.search);
let seed = Number(args.get("seed") || 2048) >>> 0;
let random, board, score, turn, round = 1, ended = false, paused = false;
let mode = args.get("mode") === "pixel" ? "pixel" : "led";
let paletteId = Object.hasOwn(PALETTES, args.get("palette")) ? args.get("palette") : "jewel";
try {
  const saved = localStorage.getItem("still-moving:2048-palette:v1");
  if (!args.has("palette") && Object.hasOwn(PALETTES, saved)) paletteId = saved;
} catch { /* Private browsing may disable storage; selection still works for this visit. */ }
let lastMove = performance.now();
let motion = null, pauseStarted = null;
const SLIDE_MS = 540;

function reset(nextSeed = seed) {
  seed = nextSeed >>> 0;
  random = mulberry32(seed);
  board = newGame(random);
  score = 0; turn = 0; ended = false;
  motion = null;
  lastMove = performance.now();
  if (paused) pauseStarted = lastMove;
}
reset();

function renderControls() {
  const list = site.querySelector(".palette-list");
  list.replaceChildren();
  for (const id of PALETTE_IDS) {
    const palette = PALETTES[id];
    const button = document.createElement("button");
    button.type = "button"; button.className = "palette-button";
    button.setAttribute("aria-pressed", String(id === paletteId));
    const title = document.createElement("span"); title.className = "palette-title"; title.textContent = palette.name;
    const strip = document.createElement("span"); strip.className = "mini-swatches"; strip.setAttribute("aria-hidden", "true");
    for (const value of TILE_VALUES) {
      const swatch = document.createElement("span");
      swatch.style.setProperty("--sample", palette.tiles[value]);
      strip.append(swatch);
    }
    button.append(title, strip);
    button.addEventListener("click", () => setPalette(id));
    list.append(button);
  }
}

function setPalette(id) {
  if (!Object.hasOwn(PALETTES, id)) return;
  paletteId = id;
  args.set("palette", id);
  history.replaceState(null, "", `${location.pathname}?${args}`);
  try { localStorage.setItem("still-moving:2048-palette:v1", id); }
  catch { /* Persisting is optional. */ }
  renderControls();
}

site.querySelector(".appearance-button").addEventListener("click", () => {
  site.classList.remove("closed"); site.querySelector(".appearance-button").hidden = true;
});
site.querySelector(".close").addEventListener("click", () => {
  site.classList.add("closed"); site.querySelector(".appearance-button").hidden = false;
  site.querySelector(".appearance-button").focus();
});
if (window.self !== window.top) {
  site.classList.add("closed"); site.querySelector(".appearance-button").hidden = false;
} else site.querySelector(".appearance-button").hidden = true;
renderControls();

function step(now) {
  if (ended) { round++; reset((seed + 1) >>> 0); return; }
  const choice = analyze(board, 3).direction;
  if (!choice) { ended = true; lastMove = now; return; }
  const result = move(board, choice);
  motion = {
    tracks: motionForMove(board, choice),
    nextBoard: spawnTile(result.board, random),
    gained: result.gained,
    started: now
  };
}

function frame(now) {
  if (!paused && motion && now - motion.started >= SLIDE_MS) {
    board = motion.nextBoard;
    score += motion.gained;
    turn++;
    motion = null;
    lastMove = now;
  }
  if (!paused && !motion && now - lastMove > (ended ? 2400 : 1100)) step(now);
  const progress = motion ? Math.min(1, Math.max(0,
    ((paused ? pauseStarted : now) - motion.started) / SLIDE_MS)) : 0;
  view.draw(renderPixels(board, motion ? { tracks: motion.tracks, progress } : null,
    PALETTES[paletteId]), mode);
  document.title = `2048 · ${PALETTES[paletteId].name} · round ${round} · move ${turn} · score ${score}${paused ? " · paused" : ""}`;
  requestAnimationFrame(frame);
}
addEventListener("keydown", event => {
  if (event.target instanceof HTMLElement && event.target.closest("button")) return;
  if (["Space", "KeyR", "KeyN", "KeyD", "KeyP"].includes(event.code)) event.preventDefault();
  if (event.code === "Space") {
    paused = !paused;
    if (paused) pauseStarted = performance.now();
    else {
      const pauseLength = performance.now() - pauseStarted;
      lastMove += pauseLength;
      if (motion) motion.started += pauseLength;
      pauseStarted = null;
    }
  }
  if (event.code === "KeyR") reset();
  if (event.code === "KeyN") { round++; reset((seed + 1) >>> 0); }
  if (event.code === "KeyD") mode = mode === "led" ? "pixel" : "led";
  if (event.code === "KeyP") {
    setPalette(PALETTE_IDS[(PALETTE_IDS.indexOf(paletteId) + 1) % PALETTE_IDS.length]);
  }
});
requestAnimationFrame(frame);
