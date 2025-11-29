import React, { useRef, useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";


export default function CopilotChat() {
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<{ file: File; label: string }[]>([]);
  const initialHistory = [
    { role: "system", content: "You are Quantpilot — a professional trading copilot." },
    { role: "assistant", content: "Welcome — upload a chart or ask a question to get started." }
  ];
  const [history, setHistory] = useState(initialHistory);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Rensa chatt
  const handleClearChat = () => {
    setHistory(initialHistory);
    setMessage("");
    setImages([]);
    setError(null);
  };


  // Handle file selection
  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Default label: empty string, user can edit later
    const filesWithLabels = files.map(file => ({ file, label: "" }));
    setImages((prev) => [...prev, ...filesWithLabels]);
  };


  // Remove image
  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  // Hantera label-input för varje bild
  const handleLabelChange = (idx: number, value: string) => {
    setImages((prev) => prev.map((img, i) => i === idx ? { ...img, label: value } : img));
  };


  // Send message and images to /api/chat
  const handleSend = async () => {
    if (!message.trim() && images.length === 0) return;
    setError(null);
    setLoading(true);
    try {
      // Skicka både text och bilder (om finns) till /api/copilot/chat
      let imagesWithLabels = await Promise.all(
        images.map(async ({ file, label }) => {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result;
              if (typeof result === "string") {
                resolve(result.split(",")[1]);
              } else {
                reject(new Error("Failed to read file as base64 string"));
              }
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          return { url: `data:image/png;base64,${base64}`, label: label || "BTCUSD chart" };
        })
      );
      const userMsg = message || (imagesWithLabels.length > 0 ? "Analysera dessa charts" : "");
      setHistory((h) => [...h, { role: "user", content: userMsg }]);
      const res = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, images: imagesWithLabels, history }),
      });
      const data = await res.text();
      try {
        // Om svaret är JSON (error), visa fel
        const parsed = JSON.parse(data);
        if (parsed.error) {
          setError(parsed.error);
          return;
        }
      } catch {
        // Inte JSON, alltså ett vanligt AI-svar
        setHistory((h) => [...h, { role: "assistant", content: data }]);
      }
      setMessage("");
      setImages([]);
    } catch (e: any) {
      setError(e.message || "Något gick fel");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="bg-white rounded-lg shadow border p-6 flex flex-col gap-4 max-w-2xl mx-auto">
      <div className="mb-2">
        <div className="font-bold text-lg mb-1">COPILOT CHAT</div>
        <div className="text-gray-500 text-sm mb-2">Ask the AI — get actionable trade ideas</div>
      </div>
      <div className="flex flex-col gap-2 min-h-[120px]">
        {history.map((msg, i) => (
          <div key={i} className={
            msg.role === "user"
              ? "self-end bg-primary/10 px-4 py-2 rounded-lg text-right"
              : msg.role === "system"
              ? "self-start text-xs text-gray-400"
              : "self-start bg-gray-100 px-4 py-2 rounded-lg"
          }>
            {msg.content}
          </div>
        ))}
        {loading && <div className="text-xs text-gray-400">AI skriver…</div>}
        {error && <div className="text-xs text-red-500">{error}</div>}
      </div>
      {/* Visa uppladdade bilder och label-inputs */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-4 my-2">
          {images.map((img, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <img
                src={URL.createObjectURL(img.file)}
                alt={`chart-${idx}`}
                className="w-20 h-20 object-cover rounded border mb-1"
              />
              <input
                type="text"
                placeholder="Label (ex: BTCUSD 1h)"
                className="border rounded px-2 py-1 text-xs"
                value={img.label}
                onChange={e => handleLabelChange(idx, e.target.value)}
                style={{ width: 100 }}
              />
              <button
                type="button"
                className="text-xs text-red-500 mt-1"
                onClick={() => removeImage(idx)}
              >Ta bort</button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2 items-center mt-2">
        <Input
          placeholder="Ask e.g. 'What position should I take on BTCUSD based on this chart?'"
          className="flex-1"
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && (message || images.length > 0) && !loading) handleSend(); }}
        />
        <input
          type="file"
          accept="image/*"
          multiple
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFiles}
        />
        <Button type="button" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
          Upload Chart(s)
        </Button>
        <Button className="bg-black text-white px-6" type="button" onClick={handleSend} disabled={!message && images.length === 0 || loading}>
          Send
        </Button>
      </div>
      <div className="flex gap-2 mt-1">
        <Button className="bg-gray-200 text-black text-xs" type="button">Daily Plan</Button>
        <Button className="bg-gray-200 text-black text-xs" type="button">Chart Position</Button>
        <Button className="bg-gray-200 text-black text-xs" type="button">Example Prompt</Button>
        <Button className="bg-red-200 text-black text-xs" type="button" onClick={handleClearChat}>Rensa chatt</Button>
      </div>
    </div>
  );
}
