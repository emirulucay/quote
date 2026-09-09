/**
 * Logos are persisted in localStorage as base64, so an untouched 3 MB upload
 * alone blows past the ~5 MB origin quota. Everything is downscaled and
 * re-encoded before it is ever handed to the store.
 */

const MAX_EDGE = 480;
const PNG_BUDGET = 220 * 1024; // beyond this a photo-like logo is cheaper as JPEG

const loadImage = (dataUrl: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image could not be decoded"));
    image.src = dataUrl;
  });

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("File could not be read"));
    reader.readAsDataURL(file);
  });

/**
 * Reads a logo file and returns a base64 data URL small enough to store.
 * Transparency is preserved via PNG unless the result is too heavy, in which
 * case it falls back to JPEG on a white background.
 */
export async function compressLogo(file: File): Promise<string> {
  const originalDataUrl = await readAsDataUrl(file);

  // SVG is already tiny and vector; rasterising it would only lose quality.
  if (file.type === "image/svg+xml") return originalDataUrl;

  const image = await loadImage(originalDataUrl);
  const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return originalDataUrl;

  context.drawImage(image, 0, 0, width, height);
  const png = canvas.toDataURL("image/png");
  if (png.length <= PNG_BUDGET) {
    return png.length < originalDataUrl.length ? png : originalDataUrl;
  }

  context.globalCompositeOperation = "destination-over";
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.85);
}
