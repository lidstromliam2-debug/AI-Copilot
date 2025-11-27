import { NextResponse } from "next/server";

// Simple in-memory cache (reset on server restart)
let cached: any[] = [];
let lastFetch = 0;
const TTL_MS = 60_000; // 60s cache to avoid hammering provider

export async function GET() {
  try {
    console.log('FINNHUB_API_KEY:', process.env.FINNHUB_API_KEY);
    const now = Date.now();

    // Serve cache if still fresh
    if (cached.length > 0 && now - lastFetch < TTL_MS) {
      return NextResponse.json(cached);
    }

    let news: any[] = [];

    // Prefer Finnhub if key present
    const finnhubKey = process.env.FINNHUB_API_KEY;
    if (finnhubKey) {
      console.log('Finnhub används, försöker hämta riktiga nyheter...');
      try {
        const generalRes = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${finnhubKey}`);
        const cryptoRes = await fetch(`https://finnhub.io/api/v1/news?category=crypto&token=${finnhubKey}`);
        if (generalRes.ok) {
          const generalJson = await generalRes.json();
          news.push(...normalizeFinnhub(generalJson));
        }
        if (cryptoRes.ok) {
          const cryptoJson = await cryptoRes.json();
          news.push(...normalizeFinnhub(cryptoJson));
        }
      } catch (e) {
        console.warn("Finnhub fetch failed, falling back to mock", e);
      }
    }

    // If provider produced nothing, fallback to mock
    if (news.length === 0) {
      console.log('Ingen Finnhub-data, använder mock-data!');
      news = getMockNews().map(enrichNewsTimestamp);
    }

    // Sort newest first
    news.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // Limit items
    news = news.slice(0, 20);

    // Update cache
    cached = news;
    lastFetch = now;
    return NextResponse.json(news);

    /* OpenAI implementation - uncomment when ready
    if (!process.env.OPENAI_API_KEY) {
      console.warn("No OPENAI_API_KEY found, returning mock data");
      return NextResponse.json(getMockNews());
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a financial news aggregator. Return valid JSON with a 'news' array containing current market news."
        },
        {
          role: "user",
          content: `Generate 8 realistic financial news items for today, November 24, 2025.

Return this exact JSON structure:
{
  "news": [
    {
      "title": "...",
      "source": "...",
      "time": "...",
      "img": "https://images.unsplash.com/...",
      "summary": "..."
    }
  ]
}

Create 8 items covering: 2 crypto, 3 stocks, 1 commodities, 2 macro.`
        }
      ],
      temperature: 0.8,
    });

    const content = response.choices[0].message.content || "{}";
    let parsed;
    
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleanContent);
    } catch (e) {
      console.error("Failed to parse OpenAI response:", content);
      return NextResponse.json(getMockNews());
    }
    
    const newsArray = Array.isArray(parsed) ? parsed : (parsed.news || []);

    if (newsArray.length === 0) {
      console.warn("OpenAI returned empty news array, using mock data");
      return NextResponse.json(getMockNews());
    }

    return NextResponse.json(newsArray);
    */
  } catch (err: any) {
    console.error("MARKET NEWS API ERROR:", err);
    const fallback = getMockNews().map(enrichNewsTimestamp);
    return NextResponse.json(fallback);
  }
}

function getMockNews() {
  return [
    {
      title: "Bitcoin Rallies Above Key Liquidity Level as Market Sentiment Improves",
      source: "Bloomberg",
      summary: "Crypto markets saw a surge in capital inflows today as major assets reclaimed critical support zones, driven by macro shifts. Institutional demand remains strong.",
      time: "2h ago",
      img: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "Stock Futures Rise Ahead of Inflation Data & Fed Comments",
      source: "Reuters",
      summary: "Investors are positioning cautiously as new macroeconomic indicators are expected to shape short-term market direction. Fed speakers scheduled this week.",
      time: "4h ago",
      img: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "Oil Prices Drop as Supply Expands Beyond Forecasts",
      source: "CNBC",
      summary: "Energy markets pull back after unexpected increases in crude inventories, hinting at weaker global demand. OPEC+ meeting outcomes under scrutiny.",
      time: "1h ago",
      img: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "Ethereum Approaches Breakout Zone With Strong On-Chain Metrics",
      source: "Coindesk",
      summary: "Analysts highlight improving network activity which may lead to a decisive move in the coming sessions. Layer-2 adoption accelerates.",
      time: "3h ago",
      img: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "Tech Stocks Rally on Strong AI Sector Performance",
      source: "Bloomberg",
      summary: "Major technology indices posted significant gains as artificial intelligence companies reported better-than-expected earnings. Nvidia leads sector higher.",
      time: "5h ago",
      img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "Gold Holds Steady as Dollar Weakens on Fed Policy Speculation",
      source: "Reuters",
      summary: "Precious metals find support as currency markets digest potential shifts in central bank monetary policy stance. Safe-haven demand persists.",
      time: "6h ago",
      img: "https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "Tesla Shares Surge After Record Delivery Numbers Beat Estimates",
      source: "CNBC",
      summary: "Electric vehicle maker reports stronger-than-expected quarterly deliveries, boosting investor confidence. Production efficiency improvements cited.",
      time: "7h ago",
      img: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "Asian Markets Mixed as China Data Shows Economic Resilience",
      source: "Bloomberg",
      summary: "Regional equities trade in narrow ranges following latest Chinese manufacturing and services data. Policy support measures continue to underpin growth.",
      time: "8h ago",
      img: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80",
    },
  ];
}

/**
 * Convert relative time string (e.g. "2h ago", "30m ago", "1d ago") to ISO publishedAt
 */
function enrichNewsTimestamp(item: any) {
  if (item.publishedAt) return item; // already enriched
  const raw: string = item.time || "0m ago";
  const now = Date.now();
  let msDelta = 0;
  const match = raw.match(/(\d+)([hmd])/);
  if (match) {
    const value = parseInt(match[1], 10);
    const unit = match[2];
    if (unit === "m") msDelta = value * 60 * 1000;
    if (unit === "h") msDelta = value * 60 * 60 * 1000;
    if (unit === "d") msDelta = value * 24 * 60 * 60 * 1000;
  }
  return {
    ...item,
    publishedAt: new Date(now - msDelta).toISOString(),
  };
}

function normalizeFinnhub(items: any[]): any[] {
  if (!Array.isArray(items)) return [];
  return items.map((n) => {
    const published = n.datetime ? new Date(n.datetime * 1000).toISOString() : new Date().toISOString();
    return {
      title: n.headline || n.title || "Untitled",
      source: n.source || "Unknown",
      summary: n.summary || "",
      publishedAt: published,
      url: n.url || null,
      image: n.image || null,
    };
  });
}
