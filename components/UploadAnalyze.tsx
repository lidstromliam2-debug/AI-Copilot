import React, { useRef, useState } from "react";
import { Button } from "./ui/Button";

export type ChartImage = { file: File; url: string };

export default function UploadAnalyze({ onImagesChange }: { onImagesChange?: (images: ChartImage[]) => void }) {
  const [images, setImages] = useState<ChartImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const newImages = files.map(file => ({ file, url: URL.createObjectURL(file) }));
    const allImages = [...images, ...newImages];
    setImages(allImages);
    onImagesChange?.(allImages);
  }

  function removeImage(idx: number) {
    const newImages = images.filter((_, i) => i !== idx);
    setImages(newImages);
    onImagesChange?.(newImages);
  }

  return (
    <div className="bg-white rounded-lg shadow border p-6 flex flex-col gap-4">
      <div className="font-semibold text-lg mb-2">CHART ANALYSIS</div>
      <div className="text-sm text-gray-500 mb-2">Upload & Analyze</div>
      <div className="flex gap-2 items-center mb-2">
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept="image/*"
          multiple
          onChange={handleFilesSelected}
        />
        <Button type="button" onClick={() => fileInputRef.current?.click()} className="bg-black text-white px-4 py-2">Choose File</Button>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {images.map((img, idx) => (
          <div key={idx} className="relative group">
            <img src={img.url} alt="chart" className="w-20 h-20 object-cover rounded border" />
            <button type="button" onClick={() => removeImage(idx)} className="absolute top-0 right-0 bg-black bg-opacity-60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100">×</button>
          </div>
        ))}
      </div>
      <div className="text-xs text-gray-400 italic mt-2">Klicka för att ladda upp bilder (5m, 1h, 4h, 1D charts etc.)</div>
    </div>
  );
}
