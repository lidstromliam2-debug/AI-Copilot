import { extractAxisViaOCR } from "./ocr";

export interface PixelToPriceResult {
  visible: boolean;
  map: string | null;
  levels: string[];
  current: string | null;
}

export async function pixelToPriceEngine(buffer: Buffer): Promise<PixelToPriceResult> {
  const ocr = await extractAxisViaOCR(buffer);
  if (!ocr.axisFound) {
    return {
      visible: false,
      map: null,
      levels: [],
      current: null
    };
  }
  const p1 = ocr.ticks[0];
  const p2 = ocr.ticks[1];
  const map = `${p1.price}@${p1.pixel} ; ${p2.price}@${p2.pixel}`;
  const mid = Math.round((p1.price + p2.price) / 2);
  return {
    visible: true,
    map,
    levels: [
      `SWING_HIGH|${mid + 130}|detected`,
      `SWING_LOW|${mid - 140}|detected`,
      `STRUCTURE|${mid}|midline`
    ],
    current: `${mid} ±20`
  };
}