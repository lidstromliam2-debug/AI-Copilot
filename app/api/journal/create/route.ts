// app/api/journal/create/route.ts
import { NextResponse } from "next/server";
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { prisma } from "../../../../lib/prisma";
import { authUser } from "../../../../lib/auth";

export async function POST(req: Request) {
  try {
    const user = await authUser(req);
    const body = await req.json();

    const journal = await prisma.journal.create({
      data: {
        userId: user.id,
        notes: body.notes,
        emotional: body.emotional || null,
        screenshot: body.screenshot || null,
      }
    });

    return NextResponse.json(journal, { status: 201 });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Invalid token") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
