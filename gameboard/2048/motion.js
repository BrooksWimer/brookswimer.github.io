// Source-to-destination paths for one ordinary 2048 move. The game rules
// remain in src/engine.js; this module only describes what the eye should see.
function indexAt(direction, line, position) {
  if (direction === "left") return line * 4 + position;
  if (direction === "right") return line * 4 + (3 - position);
  if (direction === "up") return position * 4 + line;
  return (3 - position) * 4 + line;
}

export function motionForMove(board, direction) {
  const tracks = [];
  for (let line = 0; line < 4; line++) {
    const occupied = [];
    for (let position = 0; position < 4; position++) {
      const from = indexAt(direction, line, position);
      if (board[from]) occupied.push({ value: board[from], from });
    }
    let destination = 0;
    for (let index = 0; index < occupied.length; index++) {
      const to = indexAt(direction, line, destination++);
      const current = occupied[index];
      tracks.push({ ...current, to });
      if (current.value === occupied[index + 1]?.value) {
        tracks.push({ ...occupied[++index], to });
      }
    }
  }
  return tracks;
}
