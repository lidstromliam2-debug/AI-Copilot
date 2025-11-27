// app/api/analyze-image/route.ts
import { NextResponse } from "next/server";
import { buildSystemPrompt } from "../../../lib/openai";

export const runtime = "edge";

async function analyzeImageWithVision(imageUrl: string, apiKey: string) {
  // For vision API, we need to provide the image URL directly or as base64
  let imageContent: any;
  
  if (imageUrl.startsWith('http')) {
    // Remote URL - send directly
    imageContent = { type: "image_url", image_url: { url: imageUrl } };
  } else {
    // Local file - fetch and convert to base64
    const fullUrl = imageUrl.startsWith('/') ? `http://localhost:3000${imageUrl}` : imageUrl;
    const response = await fetch(fullUrl);
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Convert to base64 manually (Edge Runtime compatible)
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    
    imageContent = { 
      type: "image_url", 
      image_url: { url: `data:image/png;base64,${base64}` } 
    };
  }

  const systemPrompt = buildSystemPrompt();
  
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { 
      "Authorization": `Bearer ${apiKey}`, 
      "Content-Type": "application/json" 
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { 
          role: "user", 
          content: [
            { type: "text", text: "Analyze this trading chart. Identify current price, key support/resistance levels, trend direction, and provide a specific trade setup with entry, stop loss, and take profit levels. Include your analysis in a JSON block." },
            imageContent
          ]
        }
      ],
      max_tokens: 1500,
      temperature: 0.15
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenAI API error: ${errorText}`);
  }

  const json = await res.json();
  return json.choices?.[0]?.message?.content || "No analysis returned";
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { imageUrl } = body;
  
  if (!imageUrl) {
    return new NextResponse(JSON.stringify({ error: "Missing imageUrl" }), { status: 400 });
  }

  try {
    const analysis = await analyzeImageWithVision(imageUrl, process.env.OPENAI_API_KEY || "");
    
    return new NextResponse(JSON.stringify({ 
      suggestionText: analysis,
      success: true 
    }), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error("Image analysis error:", error);
    return new NextResponse(JSON.stringify({ 
      error: error.message || "Analysis failed" 
    }), { 
      status: 500 
    });
  }
}
