"use client";
import { useState } from "react";
import { Button } from "../ui/Button";

export default function DailyPlan() {
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);

  async function generatePlan() {
    setLoading(true);
    setPlan("");
    const systemPrompt = `Generate a professional daily trading plan. Check these markets: BTC, ETH, GOLD, DXY, SP500. Use headings and bullet points. Include key levels, news, and actionable steps. Output in markdown.`;
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: systemPrompt,
        history: [],
        system: true
      })
    });
    if (!res.ok || !res.body) {
      setPlan("Fel: kunde inte nå AI-servern.");
      setLoading(false);
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let text = "";
    let done = false;
    while (!done) {
      const { value, done: streamDone } = await reader.read();
      done = streamDone;
      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter(Boolean);
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.replace("data: ", "").trim();
          if (data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            const content = json.choices?.[0]?.delta?.content;
            if (typeof content === "string") {
              text += content;
              setPlan(prev => prev + content);
            }
          } catch (err) {
            // Ignore lines that are not JSON
          }
        }
      }
    }
    setLoading(false);
  }

  return (
    <div>
      <Button onClick={() => { setOpen(true); generatePlan(); }} className="ml-2">Daglig plan</Button>
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl p-6 max-w-lg w-full relative">
            <button onClick={() => setOpen(false)} className="absolute top-2 right-2 text-2xl">&times;</button>
            <div className="font-bold text-lg mb-2">Daglig Tradingplan</div>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Genererar plan...</div>
            ) : (
              <div className="prose prose-invert max-w-none whitespace-pre-line" dangerouslySetInnerHTML={{ __html: plan.replace(/\n/g, '<br/>') }} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
