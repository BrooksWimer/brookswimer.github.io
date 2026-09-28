import { createGame, stepGame } from "./engine.js";
import { renderPixels } from "./render.js";
import { SNAKE_PALETTES, snakeAppearance } from "./palettes.js";
import { createLedView } from "../led-view.js";

const site = document.querySelector("#snake-arena-site");
const view = createLedView(site.querySelector("canvas"), 96, site.querySelector(".stage"));
const args = new URLSearchParams(location.search);
let seed = Number(args.get("seed") || 271828) >>> 0;
let state = createGame(seed), paused = false;
let mode = args.get("mode") === "pixel" ? "pixel" : "led";
let lastTick = performance.now();
let activeSnake = 0;
let paletteId = Object.hasOwn(SNAKE_PALETTES, args.get("palette")) ? args.get("palette") : "acid-velvet";
let colorsByPalette = Object.fromEntries(Object.entries(SNAKE_PALETTES).map(([id, palette]) => [id, palette.defaults.slice()]));

try {
  const saved = JSON.parse(localStorage.getItem("still-moving:snake-appearance:v1"));
  if (!args.has("palette") && Object.hasOwn(SNAKE_PALETTES, saved?.palette)) paletteId = saved.palette;
  for (const id of Object.keys(SNAKE_PALETTES)) {
    colorsByPalette[id] = snakeAppearance(id, saved?.choices?.[id]).snakeColors;
  }
} catch { /* Private browsing may disable storage; selection still works for this visit. */ }

let appearance = snakeAppearance(paletteId, colorsByPalette[paletteId]);
function remember() {
  appearance = snakeAppearance(paletteId, colorsByPalette[paletteId]);
  args.set("palette", paletteId);
  history.replaceState(null, "", `${location.pathname}?${args}`);
  try { localStorage.setItem("still-moving:snake-appearance:v1", JSON.stringify({ palette: paletteId, choices: colorsByPalette })); }
  catch { /* Persisting is optional. */ }
}

function renderControls() {
  const palette = SNAKE_PALETTES[paletteId];
  const paletteList = site.querySelector(".palette-list");
  paletteList.replaceChildren();
  for (const candidate of Object.values(SNAKE_PALETTES)) {
    const button = document.createElement("button");
    button.type = "button"; button.className = "palette-button";
    button.setAttribute("aria-pressed", String(candidate.id === paletteId));
    const title = document.createElement("span"); title.className = "palette-title"; title.textContent = candidate.name;
    const strip = document.createElement("span"); strip.className = "mini-swatches"; strip.setAttribute("aria-hidden", "true");
    for (const color of candidate.colors) {
      const swatch = document.createElement("span"); swatch.style.setProperty("--sample", color); strip.append(swatch);
    }
    button.append(title, strip);
    button.addEventListener("click", () => { paletteId = candidate.id; remember(); renderControls(); });
    paletteList.append(button);
  }
  site.querySelector(".food-swatch").style.setProperty("--food", palette.food);
  const snakeTabs = site.querySelector(".snake-tabs");
  snakeTabs.replaceChildren();
  colorsByPalette[paletteId].forEach((color, index) => {
    const button = document.createElement("button"); button.type = "button"; button.className = "snake-tab";
    button.setAttribute("aria-pressed", String(index === activeSnake));
    button.setAttribute("aria-label", `Select Snake ${index + 1} for coloring`);
    const dot = document.createElement("span"); dot.className = "snake-dot"; dot.style.setProperty("--snake", color); dot.setAttribute("aria-hidden", "true");
    const label = document.createElement("span"); label.textContent = `Snake ${index + 1}`;
    button.append(dot, label);
    button.addEventListener("click", () => { activeSnake = index; renderControls(); });
    snakeTabs.append(button);
  });
  site.querySelector(".active-snake-label").textContent = `Snake ${activeSnake + 1}`;
  const colorGrid = site.querySelector(".color-grid");
  colorGrid.replaceChildren();
  palette.available.forEach((color, index) => {
    const button = document.createElement("button"); button.type = "button"; button.className = "color-choice";
    button.setAttribute("aria-label", `Color ${index + 1} of 10, ${color}, for Snake ${activeSnake + 1}`);
    button.setAttribute("aria-pressed", String(colorsByPalette[paletteId][activeSnake] === color));
    const square = document.createElement("span"); square.style.setProperty("--choice", color); square.setAttribute("aria-hidden", "true");
    button.append(square);
    button.addEventListener("click", () => {
      colorsByPalette[paletteId][activeSnake] = color;
      remember(); renderControls();
    });
    colorGrid.append(button);
  });
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

function frame(now) {
  if (!paused && now - lastTick >= 145) {
    state = stepGame(state);
    lastTick = now;
  }
  view.draw(renderPixels(state, appearance), mode);
  document.title = `Snake arena · ${appearance.palette.name} · step ${state.tick} · food ${state.food.length} · resets ${state.collisions}${paused ? " · paused" : ""}`;
  requestAnimationFrame(frame);
}
addEventListener("keydown", event => {
  if (event.target instanceof HTMLElement && event.target.closest("button")) return;
  if (["Space", "KeyR", "KeyN", "KeyD"].includes(event.code)) event.preventDefault();
  if (event.code === "Space") paused = !paused;
  if (event.code === "KeyR") state = createGame(seed);
  if (event.code === "KeyN") { seed = (seed + 1) >>> 0; state = createGame(seed); }
  if (event.code === "KeyD") mode = mode === "led" ? "pixel" : "led";
  lastTick = performance.now();
});
requestAnimationFrame(frame);
