// components/CopilotChat.tsx

"use client";
import { useState, useRef } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

export default function CopilotChat({ chartImages = [], onClearImages }: { chartImages?: any[]; onClearImages?: () => void }) {
  const [input, setInput] = useState("");
  const initialMessages = [
    { role: "system", text: "You are Quantpilot — a professional trading copilot." },
    { role: "assistant", text: "Welcome — upload a chart or ask a question to get started." },
  ];
  const [messages, setMessages] = useState<{ role: string; text: string }[]>(initialMessages);
    function clearChat() {
      setMessages(initialMessages);
      setInput("");
      if (onClearImages) onClearImages();
    }
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

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
    setInput("Analyze the uploaded chart(s) and give a full actionable trade idea with entry, stop loss, take profit, and reasoning.");
    inputRef.current?.focus();
  }

  async function send() {
    if (!input.trim() && (!chartImages || chartImages.length === 0)) return;
    const userText = input.trim();
    setMessages((m) => [...m, { role: "user", text: userText || "[Chart analysis]" }]);
    setInput("");
    setLoading(true);

    const imagesPayload: { url: string }[] = [];
    if (chartImages && chartImages.length > 0) {
      for (const img of chartImages) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve((e.target?.result as string)?.split(",")[1] || "");
          reader.onerror = reject;
          reader.readAsDataURL(img.file);
        });
        imagesPayload.push({ url: `data:image/png;base64,${base64}` });
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
      if (onClearImages) onClearImages();
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
      <div className="flex gap-2 items-center mt-2">
        <Input
          ref={inputRef}
          placeholder="Ask e.g. 'What position should I take on ETH based on this chart?'"
          className="flex-1 text-black"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !loading) send(); }}
        />
        <Button className="bg-black text-white px-6" type="button" onClick={send} disabled={loading || (!input && (!chartImages || chartImages.length === 0))}>
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