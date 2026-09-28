import { colorRgb, mutedInk, PALETTES } from "./palettes.js";

const SIZE = 96;
const DIGITS = {
  0: ["###", "#.#", "#.#", "#.#", "###"],
  1: [".#.", "##.", ".#.", ".#.", "###"],
  2: ["###", "..#", "###", "#..", "###"],
  3: ["###", "..#", "###", "..#", "###"],
  4: ["#.#", "#.#", "###", "..#", "..#"],
  5: ["###", "#..", "###", "..#", "###"],
  6: ["###", "#..", "###", "#.#", "###"],
  7: ["###", "..#", "..#", "..#", "..#"],
  8: ["###", "#.#", "###", "#.#", "###"],
  9: ["###", "#.#", "###", "..#", "###"]
};

export function renderPixels(board, motion = null, palette = PALETTES.jewel) {
  const pixels = new Uint8ClampedArray(SIZE * SIZE * 4);
  function fill(x, y, width, height, color) {
    for (let py = Math.max(0, y); py < Math.min(SIZE, y + height); py++) {
      for (let px = Math.max(0, x); px < Math.min(SIZE, x + width); px++) {
        const i = (py * SIZE + px) * 4;
        pixels[i] = color[0]; pixels[i + 1] = color[1]; pixels[i + 2] = color[2]; pixels[i + 3] = 255;
      }
    }
  }
  function drawTile(value, x, y) {
    const tileColor = palette.tiles[value] || palette.tiles[2048];
    fill(x, y, 22, 22, colorRgb(tileColor));
    const label = String(value);
    // Small, crisp 3 × 5 numerals live in the upper-right of each tile.
    const startX = x + 22 - 2 - (label.length * 4 - 1);
    const startY = y + 2;
    const ink = mutedInk(tileColor, palette.inkStrength);
    for (let n = 0; n < label.length; n++) {
      const glyph = DIGITS[label[n]];
      for (let gy = 0; gy < 5; gy++) for (let gx = 0; gx < 3; gx++) {
        if (glyph[gy][gx] === "#") fill(startX + n * 4 + gx, startY + gy, 1, 1, ink);
      }
    }
  }
  fill(0, 0, SIZE, SIZE, colorRgb(palette.background));
  for (let row = 0; row < 4; row++) for (let column = 0; column < 4; column++) {
    const x = column * 24 + 1, y = row * 24 + 1;
    fill(x, y, 22, 22, colorRgb(palette.empty));
  }
  if (motion) {
    const eased = 1 - Math.pow(1 - Math.max(0, Math.min(1, motion.progress)), 3);
    const tracks = [...motion.tracks].sort((a, b) =>
      Number(a.from !== a.to) - Number(b.from !== b.to));
    for (const track of tracks) {
      const fromX = (track.from % 4) * 24 + 1;
      const fromY = Math.floor(track.from / 4) * 24 + 1;
      const toX = (track.to % 4) * 24 + 1;
      const toY = Math.floor(track.to / 4) * 24 + 1;
      drawTile(track.value, Math.round(fromX + (toX - fromX) * eased),
        Math.round(fromY + (toY - fromY) * eased));
    }
  } else {
    for (let index = 0; index < board.length; index++) {
      if (board[index]) drawTile(board[index], (index % 4) * 24 + 1,
        Math.floor(index / 4) * 24 + 1);
    }
  }
  return pixels;
}
