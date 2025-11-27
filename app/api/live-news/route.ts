import { NextResponse } from "next/server";

export const runtime = "edge";

// Fallback images for different categories
const fallbackImages = [
  "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80", // Finance
  "https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=800&q=80", // Crypto
  "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?auto=format&fit=crop&w=800&q=80", // Trading
  "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80", // Blockchain
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80", // Tech
];

export async function GET() {
  try {
    const apiKey = process.env.NEWSAPI_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ articles: getMockArticles() });
    }

    // Try multiple news sources
    const newsPromises = [
      // Financial news
      fetch(
        `https://newsapi.org/v2/top-headlines?category=business&language=en&pageSize=5&apiKey=${apiKey}`,
        { cache: 'no-store' }
      ),
      // Crypto news
      fetch(
        `https://newsapi.org/v2/everything?q=bitcoin OR ethereum OR crypto&sortBy=publishedAt&pageSize=5&language=en&apiKey=${apiKey}`,
        { cache: 'no-store' }
      ),
    ];

    const responses = await Promise.allSettled(newsPromises);
    let allArticles: any[] = [];

    for (const response of responses) {
      if (response.status === 'fulfilled' && response.value.ok) {
        const data = await response.value.json();
        if (data.articles) {
          allArticles = [...allArticles, ...data.articles];
        }
      }
    }

    // Filter out articles without images and duplicates
    const seenTitles = new Set();
    const uniqueArticles = allArticles.filter((article) => {
      if (seenTitles.has(article.title)) return false;
      seenTitles.add(article.title);
      return article.urlToImage && article.title && article.description;
    });

    // Sort by published date (most recent first)
    uniqueArticles.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    // Transform to consistent format
    const articles = uniqueArticles.slice(0, 10).map((article: any, index: number) => ({
      title: article.title,
      source: article.source?.name || "Unknown",
      summary: article.description || article.content?.substring(0, 150) || "",
      time: getTimeAgo(new Date(article.publishedAt)),
      img: article.urlToImage || fallbackImages[index % fallbackImages.length],
      url: article.url,
      publishedAt: article.publishedAt
    }));

    // If no articles, return mock data
    if (articles.length === 0) {
      return NextResponse.json({ articles: getMockArticles() });
    }

    return NextResponse.json({ articles });
  } catch (err) {
    console.error("Error fetching live news:", err);
    return NextResponse.json({ articles: getMockArticles() });
  }
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function getMockArticles() {
  const now = new Date();
  const randomMinutes = () => Math.floor(Math.random() * 180) + 10; // 10-190 min ago
  
  return [
    {
      title: "Bitcoin Rallies Above Key Liquidity Level as Market Sentiment Improves",
      source: "Bloomberg",
      summary: "Crypto markets saw a surge in capital inflows today as major assets reclaimed critical support zones, driven by macro shifts.",
      time: `${randomMinutes()}m ago`,
      img: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=800&q=80",
      url: "#",
      publishedAt: new Date(now.getTime() - randomMinutes() * 60000).toISOString()
    },
    {
      title: "Stock Futures Rise Ahead of Inflation Data & Fed Comments",
      source: "Reuters",
      summary: "Investors are positioning cautiously as new macroeconomic indicators are expected to shape short-term market direction.",
      time: `${randomMinutes()}m ago`,
      img: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80",
      url: "#",
      publishedAt: new Date(now.getTime() - randomMinutes() * 60000).toISOString()
    },
    {
      title: "Ethereum Approaches Breakout Zone With Strong On-Chain Metrics",
      source: "Coindesk",
      summary: "Analysts highlight improving network activity which may lead to a decisive move in the coming sessions.",
      time: `${randomMinutes()}m ago`,
      img: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80",
      url: "#",
      publishedAt: new Date(now.getTime() - randomMinutes() * 60000).toISOString()
    },
    {
      title: "Tech Stocks Rally on Strong AI Sector Performance",
      source: "Bloomberg",
      summary: "Major technology indices posted significant gains as artificial intelligence companies reported better-than-expected earnings.",
      time: `${randomMinutes()}m ago`,
      img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
      url: "#",
      publishedAt: new Date(now.getTime() - randomMinutes() * 60000).toISOString()
    },
    {
      title: "Oil Prices Drop as Supply Expands Beyond Forecasts",
      source: "CNBC",
      summary: "Energy markets pull back after unexpected increases in crude inventories, hinting at weaker global demand.",
      time: `${randomMinutes()}m ago`,
      img: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?auto=format&fit=crop&w=800&q=80",
      url: "#",
      publishedAt: new Date(now.getTime() - randomMinutes() * 60000).toISOString()
    },
  ];
}
