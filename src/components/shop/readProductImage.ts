const MAX_EDGE = 960;
const MAX_DATA_URL = 700_000;

export async function readProductImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose a JPEG, PNG, or WebP image");
  }
  if (file.size > 8_000_000) {
    throw new Error("Image must be under 8 MB");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read that image");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", 0.72);
  if (dataUrl.length > MAX_DATA_URL) {
    throw new Error("Image is still too large. Try a smaller photo.");
  }
  return dataUrl;
}
