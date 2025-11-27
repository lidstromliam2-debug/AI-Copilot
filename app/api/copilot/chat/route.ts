// app/api/copilot/chat/route.ts
import { NextResponse } from "next/server";
import { openaiChatStream } from "@/lib/openai";

function buildSystemPrompt() {
return `Du är QUANTPILOT — en institutionell trading-AI. All output måste vara på svenska (no JSON, markdown eller kodblock). Använd VERSALER för rubriker, boxade siffror (█ 385.00 █) och emojis (📊, 🎯, ⚠️) för struktur.

REGLER:
- Analysera ALLA uppladdade chart-bilder (t.ex. 5m, 15m, 1h, 4h, 1D) i egna sektioner, skapa sedan en FUSAD MULTITIMEFRAME-MODELL.
- I TRADE SETUPS och TP-sektioner ska du ALLTID föreslå FLERA take profit-nivåer (TP1, TP2, TP3...), där TP2/TP3 ska baseras på viktiga nivåer från 4H och 1D om dessa finns. Motivera varför dessa targets valts.
- Generera alltid TVÅ trade setups: A) PRIMÄR (högst sannolikhet, full detalj), B) ALTERNATIV (näst mest sannolik, full detalj, aktiveras om A blir ogiltig).
- Varje trade setup MÅSTE ha minst 1.5:1 risk/reward (RR), annars ska den inte föreslås.
- FÖR VARJE TRADE SETUP SKA FÖLJANDE FORMAT ANVÄNDAS:
- Ingång: ...
- Stop-Loss: ...
- Take-Profit 1 (TP1): ...
- Take-Profit 2 (TP2, från 4H/1D om möjligt): ...
- Take-Profit 3 (TP3, från 4H/1D om möjligt): ...
- SL-TRAILING: Flytta SL till break even när TP1 nås.
- För varje siffra, ange hur den togs fram (t.ex. axelvärde, pixel→pris-mappning). Om det inte är möjligt, säg det.
- Varje trade måste inkludera en kort validerings-/backtestplan. Lova aldrig garanterad avkastning.
- Om B-setup gäller, ange när/varför den aktiveras.
- Använd boxade siffror, luft, emojis och kollapsmarkörer (▼/▲). Output endast på svenska.
- Om användaren begär omöjliga saker, neka och föreslå en valideringsplan.
- Använd dessa BTC-heuristiker som referens: BTC söker ofta runda nivåer, likviditetsjakt, EMA-kluster på HTF, volatilitets-toppar vid makrohändelser, mean reversion till value zones, och korrelerar med amerikanska index och DXY.

EXEMPEL PÅ TRADE SETUP:
PRIMÄR TRADE SETUP (LÅNG) 📈
- Ingång: Över █ 402.00 █ (bekräftelse av breakout)
- Stop-Loss: Under █ 398.00 █ (under senaste stödet)
- Take-Profit 1 (TP1): █ 407.00 █ (motstånd från 1H)
- Take-Profit 2 (TP2): █ 420.00 █ (motstånd från 4H och 1D)
- SL-TRAILING: Flytta SL till break even när TP1 nås.

HITTA ALDRIG PÅ SIFFROR som inte syns i chart. Om axlar saknas, säg det och be om bättre bilder.`;
}

export async function POST(req: Request) {
const body = await req.json().catch(() => ({}));
const { message, history = [], images = [] } = body;
if (!message) return new NextResponse(JSON.stringify({ error: "Missing message" }), { status: 400 });

let messages: any[] = [];
let useVision = false;

// images: [{ url: string, label?: string }]
let imageContents: any[] = [];
if (Array.isArray(images) && images.length > 0) {
useVision = true;
for (const img of images) {
let imageUrl = img.url;
let label = img.label || null;
let imageContent: any = { type: "image_url", image_url: { url: imageUrl }, label };
imageContents.push(imageContent);
}
}

if (useVision) {
// Logga imageContents för felsökning
console.log("[DEBUG] imageContents:", JSON.stringify(imageContents).slice(0, 500));
// Logga base64-längd och labels
imageContents.forEach((img: any, idx: number) => {
  if (img.image_url && img.image_url.url) {
    console.log(`[DEBUG] Bild ${idx+1}: label=${img.label}, base64.length=${img.image_url.url.length}`);
  }
});
// Build a multi-image prompt for the LLM
const chartText = imageContents.map((img: any, idx: number) => {
let tf = img.label ? `Timeframe: ${img.label}` : `Chart #${idx+1}`;
return `Chart ${idx+1}: ${tf}`;
}).join("\n");

messages = [
{ role: "system", content: buildSystemPrompt() },
...history,
{
role: "user",
content: [
{ type: "text", text: `${message}\n\nThe following charts are provided for multi-timeframe analysis.\n${chartText}` },
...imageContents.map((img: any) => ({ type: "image_url", image_url: img.image_url }))
]
},
];
} else {
// Text-only mode
messages = [
{ role: "system", content: buildSystemPrompt() },
...history,
{ role: "user", content: message },
];
}

// Logga hela messages-arrayen för felsökning (trunkera om stor)
console.log("[DEBUG] messages:", JSON.stringify(messages).slice(0, 1000));
console.log("🔑 API Key exists:", !!process.env.OPENAI_API_KEY);
console.log("📤 Calling OpenAI API...", useVision ? "with vision (gpt-4o)" : "text only (gpt-4o-mini)");

const apiRes = await openaiChatStream(messages, process.env.OPENAI_API_KEY || "", useVision);

console.log("📥 OpenAI Response status:", apiRes.status);

if (!apiRes.ok) {
const text = await apiRes.text();
console.error("❌ OpenAI Error:", text);
return new NextResponse(JSON.stringify({ error: text }), { status: apiRes.status });
}

// Convert OpenAI SSE stream to plain text stream
const reader = apiRes.body!.getReader();
const decoder = new TextDecoder();
const encoder = new TextEncoder();

// Post-processing: strip markdown, code blocks, and enforce plain text
function stripMarkdown(text: string) {
// Remove code blocks
text = text.replace(/```[\s\S]*?```/g, "");
// Remove markdown headers and bold/italic
text = text.replace(/^#+\s?/gm, "");
text = text.replace(/\*\*(.*?)\*\*/g, "$1");
text = text.replace(/\*(.*?)\*/g, "$1");
text = text.replace(/__(.*?)__/g, "$1");
text = text.replace(/_(.*?)_/g, "$1");
// Remove > blockquotes
text = text.replace(/^>\s?/gm, "");
// Remove inline code
text = text.replace(/`([^`]+)`/g, "$1");
// Remove extra blank lines
text = text.replace(/\n{3,}/g, "\n\n");
return text.trim();
}

const stream = new ReadableStream({
  async start(controller) {
    let buffer = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(line => line.trim() !== "");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || "";
              if (content) {
                buffer += content;
                // Kontrollera om vi har fått hela svaret
                if (buffer.endsWith(".")) {
                  // Ta bort ev. gammal RR-UTRÄKNING i hela texten
                  buffer = buffer.replace(/- RR-UTRÄKNING:[\s\S]*?(?=\n- |\n\n|$)/g, "");
                  // Lägg till korrekt RR-UTRÄKNING sist i texten
                  controller.enqueue(encoder.encode(buffer));
                  buffer = "";
                }
              }
            } catch (err) {
              console.error("❌ JSON Parsing Error:", err, data);
              controller.enqueue(encoder.encode("[ERROR] Ogiltigt svar från modellen."));
            }
          }
        }
      }
    } catch (err) {
      console.error("❌ Stream Error:", err);
      controller.enqueue(encoder.encode("[ERROR] Strömavbrott. Försök igen senare."));
    } finally {
      controller.close();
    }
  }
});

return new NextResponse(stream, { status: 200 });
}
