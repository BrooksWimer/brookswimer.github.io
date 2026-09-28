import { SIZE, createGame, stepGame } from "./engine.js";
import { renderPixels } from "./render.js";

const canvas = document.querySelector("canvas");
const context = canvas.getContext("2d", { alpha: false });
const args = new URLSearchParams(location.search);
let seed = Number(args.get("seed") || 20260927) >>> 0;
let game = createGame(seed);
let paused = false;
let mode = args.get("mode") === "pixel" ? "pixel" : "led";
let showHelp = false;
let last = performance.now();
let lag = 0;
const FRAME_MS = 1000 / 24;

function fit() {
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(innerWidth * ratio);
  canvas.height = Math.round(innerHeight * ratio);
  canvas.style.width = `${innerWidth}px`;
  canvas.style.height = `${innerHeight}px`;
}
addEventListener("resize", fit);
fit();

function draw() {
  const pixels = renderPixels(game);
  context.fillStyle = "#000";
  context.fillRect(0, 0, canvas.width, canvas.height);
  const pitch = Math.min(canvas.width, canvas.height) / SIZE;
  const left = (canvas.width - SIZE * pitch) / 2;
  const top = (canvas.height - SIZE * pitch) / 2;
  if (mode === "pixel") {
    const image = new ImageData(pixels, SIZE, SIZE);
    const buffer = document.createElement("canvas");
    buffer.width = buffer.height = SIZE;
    buffer.getContext("2d").putImageData(image, 0, 0);
    context.imageSmoothingEnabled = false;
    context.drawImage(buffer, left, top, SIZE * pitch, SIZE * pitch);
  } else {
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const i = (y * SIZE + x) * 4;
      const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
      if (r + g + b < 20) continue;
      context.fillStyle = `rgb(${r},${g},${b})`;
      context.beginPath();
      context.arc(left + (x + 0.5) * pitch, top + (y + 0.5) * pitch, pitch * 0.43, 0, Math.PI * 2);
      context.fill();
    }
  }
  if (showHelp) {
    context.fillStyle = "rgba(0,0,0,.84)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#e2efeb";
    context.font = `${Math.max(13, pitch * 2)}px system-ui`;
    context.textAlign = "center";
    const lines = ["SPACE  pause / play", "R  restart same seed", "N  new seed", "D  LED / pixel view", "?  close help"];
    lines.forEach((line, index) => context.fillText(line, canvas.width / 2, canvas.height / 2 + (index - 2) * Math.max(25, pitch * 4)));
  }
  document.title = `Fixed shooter · cycle ${game.cycle} · wave ${game.wave} · ${game.phase} · tick ${game.tick}${paused ? " · paused" : ""}`;
}

function loop(now) {
  lag = Math.min(250, lag + now - last);
  last = now;
  if (!paused) while (lag >= FRAME_MS) { game = stepGame(game); lag -= FRAME_MS; }
  else lag = 0;
  draw();
  requestAnimationFrame(loop);
}

addEventListener("keydown", event => {
  if (["Space", "KeyR", "KeyN", "KeyD", "Slash"].includes(event.code)) event.preventDefault();
  if (event.code === "Space") paused = !paused;
  if (event.code === "KeyR") { game = createGame(seed); lag = 0; }
  if (event.code === "KeyN") { seed = (seed + 1) >>> 0; game = createGame(seed); lag = 0; }
  if (event.code === "KeyD") mode = mode === "led" ? "pixel" : "led";
  if (event.code === "Slash" && event.shiftKey) showHelp = !showHelp;
});

requestAnimationFrame(loop);
