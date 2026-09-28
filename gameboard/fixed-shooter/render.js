import { SIZE, enemyPosition } from "./engine.js";

export function renderPixels(state) {
  const pixels = new Uint8ClampedArray(SIZE * SIZE * 4);
  for (let i = 3; i < pixels.length; i += 4) pixels[i] = 255;
  function dot(x, y, r, g, b) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
    const i = (y * SIZE + x) * 4;
    pixels[i] = r; pixels[i + 1] = g; pixels[i + 2] = b;
  }
  function shape(cx, cy, rows, color) {
    for (let y = 0; y < rows.length; y++) {
      for (let x = 0; x < rows[y].length; x++) {
        if (rows[y][x] === "#") dot(cx + x - Math.floor(rows[y].length / 2), cy + y - Math.floor(rows.length / 2), ...color);
      }
    }
  }

  // Stars are game-field detail, not a surrounding interface or border.
  for (let i = 0; i < 22; i++) {
    const x = (i * 47 + 11) % SIZE;
    const y = (i * 31 + 3) % SIZE;
    dot(x, y, 12, 22, 31);
  }
  const palettes = [[45, 220, 202], [73, 198, 231], [129, 165, 245], [211, 134, 221], [255, 140, 161]];
  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;
    const p = enemyPosition(state, enemy);
    shape(p.x, p.y, ["..#..", ".###.", "#####", "#...#"], palettes[enemy.row]);
  }
  for (const shot of state.shots) {
    dot(shot.x, shot.y, 255, 245, 179);
    dot(shot.x, shot.y + 1, 255, 180, 113);
  }
  for (const shot of state.hostileShots) {
    dot(shot.x, shot.y, 255, 99, 111);
    dot(shot.x, shot.y - 1, 205, 56, 81);
  }
  const playerVisible = state.player.invulnerable === 0 || state.tick % 6 < 3;
  if (playerVisible) shape(state.player.x, state.player.y, ["..#..", ".###.", "#####", "#...#"], [245, 232, 171]);
  if (state.phase === "intermission") {
    const color = state.outcome === "cleared" ? [43, 198, 159] : [210, 67, 89];
    const radius = Math.min(46, state.phaseTicks * 1.3);
    for (let a = 0; a < 120; a++) {
      const angle = (a / 120) * Math.PI * 2;
      dot(48 + Math.cos(angle) * radius, 48 + Math.sin(angle) * radius, ...color);
    }
  }
  return pixels;
}
