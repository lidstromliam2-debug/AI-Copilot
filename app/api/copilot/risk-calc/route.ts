// app/api/copilot/risk-calc/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { balance, riskPercent, entry, stop } = await req.json();

    if (!balance || !riskPercent || !entry || !stop) {
      return NextResponse.json({ error: "Missing required fields: balance, riskPercent, entry, stop" }, { status: 400 });
    }

    const riskAmount = Number(balance) * (Number(riskPercent) / 100);
    const stopDistance = Math.abs(Number(entry) - Number(stop));
    const positionSize = stopDistance > 0 ? riskAmount / stopDistance : 0;

    // Calculate R:R ratios for common targets
    const tp1 = Number(entry) > Number(stop) 
      ? Number(entry) + stopDistance 
      : Number(entry) - stopDistance;
    const tp2 = Number(entry) > Number(stop) 
      ? Number(entry) + (stopDistance * 2) 
      : Number(entry) - (stopDistance * 2);

    return NextResponse.json({
      positionSize: Math.floor(positionSize * 100) / 100,
      riskAmount: Math.floor(riskAmount * 100) / 100,
      stopDistance: Math.floor(stopDistance * 100) / 100,
      suggestedTargets: {
        tp1: Math.floor(tp1 * 100) / 100,
        tp2: Math.floor(tp2 * 100) / 100,
      },
      riskRewardRatios: {
        "1R": 1,
        "2R": 2,
      }
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
