export function createLedView(canvas, size = 96) {
  const context = canvas.getContext("2d", { alpha: false });
  const buffer = document.createElement("canvas");
  buffer.width = buffer.height = size;
  const bufferContext = buffer.getContext("2d");

  function fit() {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * ratio);
    canvas.height = Math.round(innerHeight * ratio);
    canvas.style.width = `${innerWidth}px`;
    canvas.style.height = `${innerHeight}px`;
  }

  function draw(pixels, mode = "led") {
    context.fillStyle = "#000";
    context.fillRect(0, 0, canvas.width, canvas.height);
    const pitch = Math.min(canvas.width, canvas.height) / size;
    const left = (canvas.width - size * pitch) / 2;
    const top = (canvas.height - size * pitch) / 2;
    if (mode === "pixel") {
      bufferContext.putImageData(new ImageData(pixels, size, size), 0, 0);
      context.imageSmoothingEnabled = false;
      context.drawImage(buffer, left, top, size * pitch, size * pitch);
      return;
    }
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
      if (r + g + b < 15) continue;
      context.fillStyle = `rgb(${r},${g},${b})`;
      context.beginPath();
      context.arc(left + (x + 0.5) * pitch, top + (y + 0.5) * pitch, pitch * 0.43, 0, Math.PI * 2);
      context.fill();
    }
  }

  addEventListener("resize", fit);
  fit();
  return { draw, fit };
}
