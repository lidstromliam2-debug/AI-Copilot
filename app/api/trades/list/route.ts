// app/api/trades/list/route.ts
import { NextResponse } from "next/server";
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { prisma } from "../../../../lib/prisma";
import { authUser } from "../../../../lib/auth";

export async function GET(req: Request) {
  try {
    const user = await authUser(req);

    const trades = await prisma.trade.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(trades, { status: 200 });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Invalid token") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
