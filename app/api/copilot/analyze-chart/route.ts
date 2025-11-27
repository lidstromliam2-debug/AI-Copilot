// app/api/copilot/analyze-chart/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    
    if (!image) {
      return NextResponse.json({ error: "Missing image (base64 or URL)" }, { status: 400 });
    }

    // Support both base64 and URL formats
    const imageUrl = image.startsWith("http") ? image : `data:image/png;base64,${image}`;

    const result = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are Quantpilot, a professional trading chart analyst. Analyze trading charts and identify: trend direction, key support/resistance levels, chart patterns, liquidity zones, and provide actionable trade ideas with entry, stop loss, and take profit levels."
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this trading chart. Identify trend direction, key support and resistance levels, chart patterns, and liquidity zones. Provide a clear actionable trade idea with entry, stop loss, and take profit." },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        }
      ],
      max_tokens: 1000,
    });

    return NextResponse.json({ 
      analysis: result.choices[0].message.content 
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
