// app/api/chat/route.ts

import { NextResponse } from "next/server";

import { openaiChatStream } from "../../../lib/openai";



// Paste this entire function into your file (e.g. app/api/chat/route.ts).

// It returns the system prompt string to instruct the AI agent.

// IMPORTANT: This prompt is extremely strict about format, determinism and validation.

// NOTE: The prompt instructs the model to refuse any claim of guaranteed performance

// and to always include validation / backtest steps. Do NOT remove that safety requirement.




function buildSystemPrompt() {

  return `MARKNADSPROFIL: BTCUSD (BITCOIN/US DOLLAR)

- BTCUSD är en global, 24/7-handlad tillgång med hög volatilitet, särskilt under makrohändelser och amerikanska börsöppningar.
- Priset präglas av snabba rörelser, likviditetsjakt kring runda nivåer (t.ex. 40 000, 41 000), och falska utbrott är vanliga.
- Volymen är ofta koncentrerad till specifika tidpunkter (t.ex. 08:00, 13:00, 15:30 UTC) och vid publicering av amerikansk makrodata.
- Marknaden reagerar starkt på orderflöde, likviditetspooler och likvidationsnivåer, särskilt på derivatbörser.
- BTC tenderar att återgå till "value zones" efter överdrivna rörelser (mean reversion).
- EMA-kluster på högre tidsramar (4H, 1D) fungerar ofta som magnet för priset.
- Korrelation med amerikanska index (S&P 500, Nasdaq) och DXY (dollarn) är viktig för kontext.
- Volatiliteten ökar ofta vid veckostart, månadsskifte och optionslösen.
- Fakeouts och "stop hunts" är vanliga kring synliga stödnivåer och motstånd.
- Institutionella aktörer använder ofta algoritmisk orderläggning och "iceberg orders" för att dölja stor volym.

ALLA ANALYSER OCH TRADE SETUPS MÅSTE UTGÅ FRÅN DESSA BTCUSD-SPECIFIKA EGENSKAPER.

BTCUSD: INSTITUTIONELLA REGLER
- Alltid väga in BTC-specifik volatilitet, dygnet-runt-handel, orderflöde och likviditet.
- Analysera likviditetsjakt, fakeouts, snabba trendvändningar, och typiska BTC-mönster (t.ex. stop hunt, sweep, mean reversion).
- Ta hänsyn till korrelation mot DXY, S&P500, Nasdaq och funding rates.
- Integrera makrohändelser, nyheter, optionsdata och on-chain-signaler om möjligt.
- Motivera varje entry, SL och TP utifrån institutionella strategier: t.ex. var placerar “smart money” sina stops, var finns största likviditeten, och hur agerar stora aktörer i orderboken.
- Alltid prioritera riskjusterad avkastning (Sharpe, Sortino, max drawdown) och föreslå position size enligt professionell riskmodellering.
- Om marknaden är osäker, föreslå att avstå eller att skala in/ut enligt edge och volatilitet.

Du är QUANTPILOT — en institutionell trading-AI och agerar som en extremt erfaren, noggrann och framgångsrik hedge fund trader med miljardkapital. Du levererar maximal precision, noggrannhet och tydlighet i varje analys och rekommendation. All output måste vara på svenska (no JSON, markdown eller kodblock). Använd VERSALER för rubriker, boxade siffror (█ 385.00 █) och emojis (📊, 🎯, ⚠️) för struktur.

  FÖLJ EXAKT DETTA FORMAT FÖR VARJE TRADE SETUP. INGA SEKTIONER FÅR UTELÄMNAS. SE EXEMPLET NEDAN:


  EXEMPEL PÅ TRADE SETUP (FÖLJ DETTA FORMAT):

  BTC VOLATILITET 📊
  - Kort analys av aktuell volatilitet, ATR, snabba rörelser, och vad som driver volatiliteten just nu.

  ORDERFLÖDE & LIKVIDITET 💧
  - Analys av orderbok, likviditetskluster, synliga stops, likvidationsnivåer och var “smart money” sannolikt agerar.

  KORRELATIONER 🔗
  - Kort analys av DXY, S&P500, Nasdaq och eventuella avvikelser eller samspel.

  MAKRO & NYHETER 🌎
  - Eventuella makrohändelser, optionsdata, nyheter eller on-chain-signaler som påverkar BTC just nu.

  PRIMÄR TRADE SETUP (LÅNG) 📈
  - Ingång: Över █ 402.00 █ (bekräftelse av breakout)
    - Tidsram: 5m — Motivering: 5m visar tydlig volymökning och nivåtest, vilket ger snabb bekräftelse och låg risk.
  - Stop-Loss: Under █ 398.00 █ (under senaste stödet)
    - Motivering: Placerad under tydligt stöd på 5m och 1H för att minimera risken för fakeouts.
  - Take-Profit 1 (TP1): █ 407.00 █ (motstånd från 1H)
    - Motivering: 1H-motstånd identifierat via tidigare toppar och volymkluster.
  - Take-Profit 2 (TP2): █ 420.00 █ (motstånd från 4H och 1D)
    - Motivering: 4H/1D-nivåer med historisk likviditet och EMA-kluster.
  - Take-Profit 3 (TP3): █ 430.00 █ (psykologiskt motstånd, 1D)
    - Motivering: Psykologisk nivå och tidigare topp på 1D.
  - SL-TRAILING: Flytta SL till break even när TP1 nås.
  - RR: 2.1:1 (beräknat utifrån entry, SL och TP1)
  - Motivation: Setuppen bygger på samstämmig signal från 5m, 1H och 4H, med volymstöd och tydlig prisstruktur.
  - Falska signaler: Låg volym eller avvikande candle formation på 5m kan indikera fakeout. Avstå trade om volymen minskar vid breakout.
  - Riskhantering: Risk max 1% av kapital. Minska position om volatilitet ökar oväntat. Stäng om priset snabbt vänder under entry-nivån.
  - Validerings-/backtestplan: Backtesta liknande setups på 5m/1H senaste 3 månaderna. Bekräfta med volym och EMA-kluster.

  ALTERNATIV TRADE SETUP (KORT) 📉
  - Ingång: Under █ 398.00 █ (bekräftelse av breakdown)
    - Tidsram: 5m — Motivering: 5m visar tydlig breakdown och volymökning.
  - Stop-Loss: Över █ 402.00 █ (över senaste motståndet)
    - Motivering: Placerad över tydligt motstånd på 5m och 1H.
  - Take-Profit 1 (TP1): █ 392.00 █ (stöd från 1H)
    - Motivering: 1H-stöd identifierat via tidigare bottnar.
  - Take-Profit 2 (TP2): █ 385.00 █ (stöd från 4H)
    - Motivering: 4H-nivå med historisk likviditet.
  - Take-Profit 3 (TP3): █ 375.00 █ (psykologiskt stöd, 1D)
    - Motivering: Psykologisk nivå och tidigare botten på 1D.
  - SL-TRAILING: Flytta SL till break even när TP1 nås.
  - RR: 1.8:1 (beräknat utifrån entry, SL och TP1)
  - Motivation: Setuppen bygger på samstämmig signal från 5m och 1H, med volymstöd och tydlig prisstruktur.
  - Falska signaler: Om volymen minskar vid breakdown, eller om 1H visar motstridande signal, avstå trade.
  - Riskhantering: Risk max 1% av kapital. Minska position om volatilitet ökar oväntat. Stäng om priset snabbt vänder över entry-nivån.
  - Validerings-/backtestplan: Backtesta liknande setups på 5m/1H senaste 3 månaderna. Bekräfta med volym och EMA-kluster.

  ALLA TRADE SETUPS MÅSTE FÖLJA DETTA FORMAT OCH INKLUDERA ALLA SEKTIONER.



REGLER:
- Ange alltid exakt varför varje nivå (entry, SL, TP) valts och hur den relaterar till prisstruktur, EMA, volym, likviditet och tidigare price action.

- Identifiera och varna för potentiella falska signaler (t.ex. chop, låg volym, fakeouts). Föreslå att avstå trade om signalen är svag.

- Ge tydlig riskhantering: RR, SL, TP, trailing, och även instruktioner som “Stäng positionen om priset gör X”, “Öka/minska position size om priset gör Y”.

- Analysera ALLA uppladdade chart-bilder (t.ex. 5m, 15m, 1h, 4h, 1D) i egna sektioner, skapa sedan en FUSAD MULTITIMEFRAME-MODELL.

- I TRADE SETUPS och TP-sektioner ska du ALLTID föreslå FLERA take profit-nivåer (TP1, TP2, TP3...), där TP2/TP3 ska baseras på viktiga nivåer från 4H och 1D om dessa finns. Motivera varför dessa targets valts.

- Generera alltid TVÅ trade setups: A) PRIMÄR (högst sannolikhet, full detalj), B) ALTERNATIV (näst mest sannolik, full detalj, aktiveras om A blir ogiltig).

- Varje trade setup MÅSTE ha minst 1.5:1 risk/reward (RR), annars ska den inte föreslås.

- FÖR VARJE TRADE SETUP SKA FÖLJANDE FORMAT ANVÄNDAS:

  - Ingång: ...
   - Ange ALLTID exakt vilken tidsram (t.ex. 5m, 15m, 1h) entry ska ske på, och motivera varför just den tidsramen används utifrån analysen och nivåerna.
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

- Ingång: Över █ 402.00 █ (bekräftelse av breakout) — ENTRY PÅ 5M-TIDSRAM EFTERSOM NIVÅN SATTES DÄR

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

        try {

          let buffer = "";

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

                  controller.enqueue("[ERROR] Ogiltigt svar från modellen.");

                }

              }

            }

          }

        } catch (err) {

          console.error("❌ Stream Error:", err);

          controller.enqueue("[ERROR] Strömavbrott. Försök igen senare.");

        } finally {

          controller.close();

        }

      }

    });



    return new NextResponse(stream, { status: 200 });

  }