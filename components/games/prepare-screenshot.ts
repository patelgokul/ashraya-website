const MAX_EDGE = 1600;
const MAX_BYTES = 5 * 1024 * 1024;

export async function prepareScreenshot(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Attach a JPG, PNG, or WEBP screenshot");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Could not read that image. Use a JPG, PNG, or WEBP screenshot.");
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not read that image. Use a JPG, PNG, or WEBP screenshot.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  let blob: Blob | null = null;
  for (let quality = 0.85; quality >= 0.5; quality -= 0.15) {
    blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (blob && blob.size <= MAX_BYTES) break;
  }
  if (!blob || blob.size > MAX_BYTES || blob.size === 0) throw new Error("Screenshot must be 5 MB or smaller");
  return new File([blob], "benevity.jpg", { type: "image/jpeg" });
}
