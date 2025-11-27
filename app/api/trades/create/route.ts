// app/api/trades/create/route.ts
import { NextResponse } from "next/server";
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { prisma } from "../../../../lib/prisma";
import { authUser } from "../../../../lib/auth";

export async function POST(req: Request) {
  try {
    const user = await authUser(req);
    const body = await req.json();
    const { asset, direction, entry, stopLoss, takeProfit, size, result } = body;

    if (!asset || !direction || !entry || !stopLoss || !size) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const trade = await prisma.trade.create({
      data: {
        userId: user.id,
        asset,
        direction,
        entry: parseFloat(entry),
        stopLoss: parseFloat(stopLoss),
        takeProfit: takeProfit ? parseFloat(takeProfit) : null,
        size: parseFloat(size),
        result: result ? parseFloat(result) : null,
      }
    });

    return NextResponse.json(trade, { status: 201 });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Invalid token") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
