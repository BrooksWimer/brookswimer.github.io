import { PALETTE_IDS, PALETTES, TILE_VALUES } from "../2048/palettes.js";

const FOOD_TILE = { jewel: 2, "acid-velvet": 2, "cool-neutrals": 16, "warm-neutrals": 2 };
const DEFAULT_TILES = {
  jewel: [64, 1024, 8],
  "acid-velvet": [64, 128, 2048],
  "cool-neutrals": [512, 2, 2048],
  "warm-neutrals": [1024, 256, 2048]
};

export const SNAKE_PALETTES = Object.fromEntries(PALETTE_IDS.map(id => {
  const base = PALETTES[id];
  const food = base.tiles[FOOD_TILE[id]];
  const colors = TILE_VALUES.map(value => base.tiles[value]);
  return [id, {
    id, name: base.name, colors, food,
    available: colors.filter(color => color !== food),
    defaults: DEFAULT_TILES[id].map(value => base.tiles[value])
  }];
}));

export function snakeAppearance(id = "acid-velvet", snakeColors) {
  const palette = SNAKE_PALETTES[id] || SNAKE_PALETTES["acid-velvet"];
  const colors = Array.isArray(snakeColors) && snakeColors.length === 3 &&
    snakeColors.every(color => palette.available.includes(color))
    ? snakeColors.slice() : palette.defaults.slice();
  return { palette, snakeColors: colors };
}
