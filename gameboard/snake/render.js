import { SIZE } from "./engine.js";

const COLORS = [[65, 218, 196], [254, 173, 97], [187, 135, 251]];

export function renderPixels(state) {
  const pixels = new Uint8ClampedArray(SIZE * SIZE * 4);
  function fill(x, y, size, color) {
    for (let yy = Math.max(0, y); yy < Math.min(SIZE, y + size); yy++) {
      for (let xx = Math.max(0, x); xx < Math.min(SIZE, x + size); xx++) {
        const i = (yy * SIZE + xx) * 4;
        pixels[i] = color[0]; pixels[i + 1] = color[1]; pixels[i + 2] = color[2]; pixels[i + 3] = 255;
      }
    }
  }
  fill(0, 0, SIZE, [5, 15, 24]);
  for (let y = 3; y < SIZE; y += 9) for (let x = 4; x < SIZE; x += 9) fill(x, y, 1, [17, 39, 54]);
  for (const food of state.food) {
    fill(food.x - 1, food.y - 1, 3, [152, 122, 64]);
    fill(food.x, food.y, 1, [255, 235, 137]);
  }
  for (const snake of state.snakes) {
    const color = COLORS[snake.id];
    for (let i = snake.body.length - 1; i >= 0; i--) {
      const part = snake.body[i];
      const fade = 0.38 + 0.62 * (1 - i / snake.body.length);
      fill(part.x - 1, part.y - 1, 3, color.map(channel => Math.round(channel * fade)));
    }
    const head = snake.body[0];
    fill(head.x, head.y, 1, [245, 250, 248]);
  }
  return pixels;
}
