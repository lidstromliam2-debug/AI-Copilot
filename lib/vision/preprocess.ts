import { pixelToPriceEngine } from "./pixelPriceEngine";

export interface PreprocessResult {
  imageCount: number;
  lines: string[];
}

export async function preprocessImages(imageParts: Array<{ image_url: { url: string } }>): Promise<PreprocessResult> {
  if (!imageParts || imageParts.length === 0) {
    return { imageCount: 0, lines: [] };
  }
  const lines: string[] = [];
  let index = 1;
  for (const img of imageParts) {
    const base64 = img.image_url.url.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64, "base64");
    const data = await pixelToPriceEngine(buffer);
    lines.push(`IMAGE_${index}_TIMEFRAME: 5m`);
    lines.push(`IMAGE_${index}_PRICE_AXIS_VISIBLE: ${data.visible}`);
    if (data.visible) {
      lines.push(`IMAGE_${index}_PIXEL_TO_PRICE_MAP: ${data.map}`);
      lines.push(`IMAGE_${index}_CURRENT_PRICE_ESTIMATE: ${data.current}`);
      lines.push(`IMAGE_${index}_EXTRACTIONS: ${data.levels.join("; ")}`);
    }
    index++;
  }
  return { imageCount: imageParts.length, lines };
}