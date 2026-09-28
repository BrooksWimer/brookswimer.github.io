import { SIZE } from "./engine.js";
import { colorRgb } from "../2048/palettes.js";
import { snakeAppearance } from "./palettes.js";

export function renderPixels(state, appearance = snakeAppearance()) {
  const { palette, snakeColors } = appearance;
  const foodColor = colorRgb(palette.food);
  const colors = snakeColors.map(colorRgb);
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
    fill(food.x - 1, food.y - 1, 3, foodColor.map(channel => Math.round(channel * 0.55)));
    fill(food.x, food.y, 1, foodColor);
  }
  for (const snake of state.snakes) {
    const color = colors[snake.id];
    for (let i = snake.body.length - 1; i >= 0; i--) {
      const part = snake.body[i];
      const fade = 0.38 + 0.62 * (1 - i / snake.body.length);
      fill(part.x - 1, part.y - 1, 3, color.map(channel => Math.round(channel * fade)));
    }
    const head = snake.body[0];
    fill(head.x, head.y, 1, color);
  }
  return pixels;
}
