export function createLedView(canvas, size = 96, viewport = null) {
  const context = canvas.getContext("2d", { alpha: false });
  const buffer = document.createElement("canvas");
  buffer.width = buffer.height = size;
  const bufferContext = buffer.getContext("2d");

  function fit() {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    const width = viewport ? viewport.clientWidth : innerWidth;
    const height = viewport ? viewport.clientHeight : innerHeight;
    if (!width || !height) return;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
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
  if (viewport) new ResizeObserver(fit).observe(viewport);
  fit();
  return { draw, fit };
}
