// components/CopilotChat.tsx

"use client";
import { useState, useRef } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

export default function CopilotChat() {
  const [input, setInput] = useState("");
  const initialMessages = [
    { role: "system", text: "You are Quantpilot — a professional trading copilot." },
    { role: "assistant", text: "Welcome — upload a chart or ask a question to get started." },
  ];
  const [messages, setMessages] = useState<{ role: string; text: string }[]>(initialMessages);
  const [images, setImages] = useState<{ file: File; label: string }[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);

  function clearChat() {
    setMessages(initialMessages);
    setInput("");
    setImages([]);
  }

  function downloadLastAISvar() {
    const last = [...messages].reverse().find(m => m.role === "assistant");
    if (!last) return;
    const blob = new Blob([last.text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quantpilot-ai-svar.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  function insertChartPrompt() {
    setInput("Analysera de uppladdade chart-bilderna och leverera en komplett, handlingsbar trade setup enligt EXAKTA instruktioner och formatet i systemprompten. Inkludera ALLA sektioner: entry, exakt tidsram och motivering, stop loss, flera take profit-nivåer (TP1, TP2, TP3), motivation, riskhantering, varning för falska signaler, och en tydlig validerings-/backtestplan. Motivera varje nivå och beslut utifrån prisstruktur, volym, likviditet och tidigare price action. Följ formatet till punkt och pricka – inga sektioner får utelämnas.");
    inputRef.current?.focus();
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const filesWithLabels = files.map(file => ({ file, label: "" }));
    setImages(prev => [...prev, ...filesWithLabels]);
  }

  function removeImage(idx: number) {
    setImages(prev => prev.filter((_, i) => i !== idx));
  }

  function handleLabelChange(idx: number, value: string) {
    setImages(prev => prev.map((img, i) => i === idx ? { ...img, label: value } : img));
  }

  async function send() {
    if (!input.trim() && images.length === 0) return;
    const userText = input.trim();
    setMessages((m) => [...m, { role: "user", text: userText || "[Chart analysis]" }]);
    setInput("");
    setLoading(true);

    const imagesPayload: { url: string; label: string }[] = [];
    if (images.length > 0) {
      for (const img of images) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve((e.target?.result as string)?.split(",")[1] || "");
          reader.onerror = reject;
          reader.readAsDataURL(img.file);
        });
        imagesPayload.push({ url: `data:image/png;base64,${base64}`, label: img.label || "BTCUSD chart" });
      }
    }

    try {
      const res = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText || "Analyze uploaded chart(s)", images: imagesPayload })
      });
      const reader = res.body?.getReader();
      let aiText = "";
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          aiText += new TextDecoder().decode(value);
        }
      }
      setMessages((m) => [...m, { role: "assistant", text: aiText || "[No response]" }]);
      setImages([]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", text: "[Fel vid AI-anrop]" }]);
    }
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-lg shadow border p-6 flex flex-col gap-4 max-w-2xl mx-auto">
      <div className="mb-2">
        <div className="font-bold text-lg mb-1">COPILOT CHAT</div>
        <div className="text-gray-500 text-sm mb-2">Ask the AI — get actionable trade ideas</div>
      </div>
      <div className="flex flex-col gap-2 min-h-[120px]">
        {messages.map((msg, i) => (
          <div key={i} className={
            msg.role === "user"
              ? "self-end bg-primary/10 px-4 py-2 rounded-lg text-right"
              : msg.role === "system"
              ? "self-start text-xs text-gray-400"
              : "self-start bg-gray-100 px-4 py-2 rounded-lg whitespace-pre-line"
          }>
            {msg.role === "assistant"
              ? formatAISvar(msg.text)
              : msg.text}
          </div>
        ))}
        {loading && <div className="text-xs text-gray-400">AI skriver…</div>}
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
          ref={inputRef}
          placeholder="Ask e.g. 'What position should I take on BTCUSD based on this chart?'"
          className="flex-1 text-black"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !loading) send(); }}
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
        <Button className="bg-black text-white px-6" type="button" onClick={send} disabled={loading || (!input && images.length === 0)}>
          Send
        </Button>
      </div>
      <div className="flex gap-2 mt-1">
        <Button className="bg-gray-200 text-black text-xs" type="button" onClick={insertChartPrompt}>Chart Position</Button>
        <Button className="bg-gray-200 text-black text-xs" type="button" onClick={downloadLastAISvar}>Ladda ner AI-svar</Button>
        <Button className="bg-red-200 text-black text-xs" type="button" onClick={clearChat}>Rensa chatt</Button>
      </div>
    </div>
  );
}

function formatAISvar(text: string) {
  if (!text) return "";
  let formatted = text;
  formatted = formatted.replace(/^#+\s?/gm, "");
  formatted = formatted.replace(/^(.*(ANALYS|MODELL|SETUP|TRADE|TP|SL|TREND|STÖD|MOTSTÅND).*)$/gim, "**$1**");
  formatted = formatted.replace(/(MULTITIMEFRAME|PRIMÄR TRADE SETUP|ALTERNATIV TRADE SETUP|FUSAD MULTITIMEFRAME-MODELL)/g, "\n$1");
  formatted = formatted.replace(/^- /gm, "• ");
  formatted = formatted.replace(/\n{3,}/g, "\n\n");
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, (_: string, p1: string) => `<b>${p1}</b>`);
  formatted = formatted.replace(/([A-ZÅÄÖ][A-ZÅÄÖ\s]+):/g, '<b>$1:</b>');
  return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
}