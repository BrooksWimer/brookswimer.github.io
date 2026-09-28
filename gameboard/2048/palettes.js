export const TILE_VALUES = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];

// A palette is display data: future phone controls can supply the same shape
// with custom tile colors without changing the game rules or animation.
export const PALETTES = {
  jewel: {
    name: "Violet Pulse",
    inkStrength: 0.27,
    background: "#091222",
    empty: "#142336",
    tiles: {
      2: "#65C958", 4: "#22B06B", 8: "#00B69D", 16: "#0E5F66",
      32: "#5F8BE6", 64: "#2456A8", 128: "#713DBD", 256: "#925FD8",
      512: "#A148B2", 1024: "#D052A7", 2048: "#E682C6"
    }
  },
  "acid-velvet": {
    name: "Acid Velvet",
    inkStrength: 0.26,
    background: "#180F1A",
    empty: "#342631",
    tiles: {
      2: "#D9ED4C", 4: "#A7C738", 8: "#DAA83E", 16: "#852B32",
      32: "#6C1736", 64: "#B63250", 128: "#D75A9D", 256: "#A52C73",
      512: "#7E235F", 1024: "#3B652C", 2048: "#6B8E25"
    }
  },
  "cool-neutrals": {
    name: "Frosted Linen",
    inkStrength: 0.18,
    background: "#3C5363",
    empty: "#667E8C",
    tiles: {
      2: "#8DCEBD", 4: "#9CB8AF", 8: "#B4D4E4", 16: "#F2F4EE",
      32: "#E5DFCC", 64: "#BDBBB4", 128: "#6C8A8C", 256: "#6E9EB7",
      512: "#3D627B", 1024: "#898CA8", 2048: "#B6A8C4"
    }
  },
  "warm-neutrals": {
    name: "Copper Hush",
    inkStrength: 0.16,
    background: "#654F40",
    empty: "#856B58",
    tiles: {
      2: "#F8E7D5", 4: "#E2CEB3", 8: "#C1A185", 16: "#E9B0A5",
      32: "#AC795F", 64: "#C8845D", 128: "#EEAE77", 256: "#FFD2A3",
      512: "#D9BBA0", 1024: "#BE5F43", 2048: "#8F493E"
    }
  }
};

export const PALETTE_IDS = Object.keys(PALETTES);

export function colorRgb(color) {
  if (Array.isArray(color)) return color;
  if (!/^#[0-9a-f]{6}$/i.test(color)) throw new Error(`Invalid palette color: ${color}`);
  return [1, 3, 5].map(index => parseInt(color.slice(index, index + 2), 16));
}

function luminance(rgb) {
  const [r, g, b] = rgb.map(channel => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}

export function contrastRatio(a, b) {
  const first = luminance(colorRgb(a)), second = luminance(colorRgb(b));
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

export function mutedInk(tileColor, strength = 0.22) {
  const tile = colorRgb(tileColor);
  const lighter = tile.reduce((sum, channel) => sum + channel, 0) / 3 < 128;
  // Mixing toward one neutral endpoint preserves the tile's color family.
  // This is intentionally a subtle art-direction choice, not a WCAG target.
  const endpoint = lighter ? 255 : 0;
  return tile.map(channel => Math.round(channel * (1 - strength) + endpoint * strength));
}
