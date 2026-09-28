const SIZE = 96;
const BACK = [187, 173, 160];
const EMPTY = [205, 193, 180];
const TILE = {
  2: [238, 228, 218], 4: [237, 224, 200], 8: [242, 177, 121],
  16: [245, 149, 99], 32: [246, 124, 95], 64: [246, 94, 59],
  128: [237, 207, 114], 256: [237, 204, 97], 512: [237, 200, 80],
  1024: [237, 197, 63], 2048: [237, 194, 46]
};
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

export function renderPixels(board) {
  const pixels = new Uint8ClampedArray(SIZE * SIZE * 4);
  function fill(x, y, width, height, color) {
    for (let py = Math.max(0, y); py < Math.min(SIZE, y + height); py++) {
      for (let px = Math.max(0, x); px < Math.min(SIZE, x + width); px++) {
        const i = (py * SIZE + px) * 4;
        pixels[i] = color[0]; pixels[i + 1] = color[1]; pixels[i + 2] = color[2]; pixels[i + 3] = 255;
      }
    }
  }
  fill(0, 0, SIZE, SIZE, BACK);
  for (let row = 0; row < 4; row++) for (let column = 0; column < 4; column++) {
    const value = board[row * 4 + column];
    const x = column * 24 + 1, y = row * 24 + 1;
    fill(x, y, 22, 22, TILE[value] || (value ? [60, 58, 50] : EMPTY));
    if (!value) continue;
    const label = String(value), scale = label.length >= 4 ? 1 : 2;
    const glyphWidth = (label.length * 4 - 1) * scale;
    const startX = x + Math.floor((22 - glyphWidth) / 2);
    const startY = y + Math.floor((22 - 5 * scale) / 2);
    const ink = value <= 4 ? [119, 110, 101] : [255, 250, 242];
    for (let n = 0; n < label.length; n++) {
      const glyph = DIGITS[label[n]];
      for (let gy = 0; gy < 5; gy++) for (let gx = 0; gx < 3; gx++) {
        if (glyph[gy][gx] === "#") fill(startX + (n * 4 + gx) * scale, startY + gy * scale, scale, scale, ink);
      }
    }
  }
  return pixels;
}
