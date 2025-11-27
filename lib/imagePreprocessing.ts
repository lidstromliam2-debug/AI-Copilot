import sharp from "sharp";
import fs from "fs";

/**
* Downloads an image from a URL to a local file
*/
export async function downloadImage(url: string, dest: string): Promise<string> {
const res = await fetch(url);
if (!res.ok) throw new Error("Failed to download image");
const arrayBuffer = await res.arrayBuffer();
fs.writeFileSync(dest, Buffer.from(arrayBuffer));
return dest;
}

/**
* Very simple preprocessing: validate and convert to PNG
*/
export async function deskewCropImage(filePath: string): Promise<string> {
const outputPath = filePath.replace(/(\.[^.]+)$/, "_processed.png");

// Ensure image is readable
await sharp(filePath).png().toFile(outputPath);

return outputPath;
}

/**
* REMOVE OCR — Vision handles all text & price reading
*/
export async function detectPriceAxisTicks(): Promise<any[]> {
return []; // Not used anymore
}

export function computePixelToPriceMap(): string | null {
return null; // Not used anymore
}

export async function extractLevels(): Promise<string[]> {
return []; // Not used anymore
}
