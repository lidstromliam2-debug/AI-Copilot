// app/api/risk/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { portfolioValue, riskPercent, entryPrice, stopLossPercent, direction = "long" } = body;
  if (!portfolioValue || !riskPercent) return new NextResponse(JSON.stringify({ error: "Missing portfolio or risk" }), { status: 400 });

  const riskAmount = Number(portfolioValue) * (Number(riskPercent) / 100);
  if (!entryPrice || !stopLossPercent) {
    return new NextResponse(JSON.stringify({ positionSize: null, riskAmount, message: "Provide entryPrice and stopLossPercent for exact position size." }), { status: 200 });
  }

  const dollarStop = Number(entryPrice) * (Number(stopLossPercent) / 100);
  const positionSize = Math.floor(riskAmount / dollarStop);
  const tp1 = direction === "long" ? Number(entryPrice) + dollarStop : Number(entryPrice) - dollarStop;
  const tp2 = direction === "long" ? Number(entryPrice) + 2 * dollarStop : Number(entryPrice) - 2 * dollarStop;

  return new NextResponse(JSON.stringify({
    positionSize,
    riskAmount,
    dollarStop,
    suggestedTps: [tp1, tp2],
    rrAtTp: [ (tp1 - Number(entryPrice)) / dollarStop, (tp2 - Number(entryPrice)) / dollarStop ],
    assumptions: "Basic distance multiples."
  }), { status: 200 });
}
