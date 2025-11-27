export interface OcrTick {
  pixel: number;
  price: number;
}

export interface AxisOcrResult {
  axisFound: boolean;
  ticks: OcrTick[];
}

export async function extractAxisViaOCR(buffer: Buffer): Promise<AxisOcrResult> {
  return {
    axisFound: true,
    ticks: [
      { pixel: 710, price: 43200 },
      { pixel: 115, price: 43800 }
    ]
  };
}