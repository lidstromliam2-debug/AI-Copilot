// app/api/news/latest/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cryptoPanicKey = process.env.CRYPTO_PANIC_KEY;

    if (!cryptoPanicKey) {
      return NextResponse.json({ error: "CRYPTO_PANIC_KEY not configured" }, { status: 500 });
    }

    const res = await fetch(
      `https://cryptopanic.com/api/v1/posts/?auth_token=${cryptoPanicKey}&public=true&kind=news`
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch news" }, { status: res.status });
    }

    const data = await res.json();

    return NextResponse.json(data.results || [], { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
