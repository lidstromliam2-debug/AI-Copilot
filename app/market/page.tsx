"use client";

import { useState, useEffect } from "react";

interface NewsItem {
  title: string;
  source: string;
  summary: string;
  time: string;
  img: string;
  publishedAt?: string;
}
import dynamic from "next/dynamic";
const MarketOverviewPanel = dynamic(() => import("@/components/market/MarketOverviewPanel"), { ssr: false });

// --------------------------------------------------
// Premium Bloomberg-Inspired Market News UI
// --------------------------------------------------

// Add fade-in animation styles
const styles = `
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
}
`;

export default function MarketNewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newArticleIds, setNewArticleIds] = useState<Set<string>>(new Set());

  // Fetch live data from backend
  useEffect(() => {
    // Fetch live news from API
    async function fetchLiveNews() {
      try {
        const res = await fetch("/api/live-news");
        if (!res.ok) throw new Error("Failed to fetch live news");
        const data = await res.json();
        
        const newsArray = data.articles || [];
        
        if (newsArray.length > 0) {
          setNews((prevNews) => {
            // Get IDs of existing news
            const existingIds = new Set(prevNews.map((n) => n.title));
            
            // Find truly new articles
            const newArticles = newsArray.filter((n: NewsItem) => !existingIds.has(n.title));
            
            if (newArticles.length > 0) {
              // Mark new articles for animation
              const newIds = new Set<string>(newArticles.map((n: NewsItem) => n.title));
              setNewArticleIds(newIds);
              
              // Remove animation class after 1s
              setTimeout(() => setNewArticleIds(new Set<string>()), 1000);
              
              // Add new articles at the top
              return [...newArticles, ...prevNews];
            }
            
            return prevNews;
          });
        }
      } catch (err: any) {
        console.error("Error fetching live news:", err);
      }
    }

    // Initial fetch
    async function fetchNews() {
      try {
        setLoading(true);
        const res = await fetch("/api/live-news");
        if (!res.ok) throw new Error("Failed to fetch news");
        const data = await res.json();
        
        const newsArray = data.articles || [];
        
        if (newsArray.length > 0) {
          setNews(newsArray);
        } else {
          // Fallback to mock data
          setNews([
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
        ]);
        }
      } catch (err: any) {
        console.error("Error fetching news:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchNews();
    
    // Auto-update news every 30 seconds
    const newsInterval = setInterval(fetchLiveNews, 30000);
    
    // Cleanup intervals on unmount
    return () => {
      clearInterval(newsInterval);
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="min-h-screen bg-bloomberg-bg">
      {/* Global ticker is now provided by RootLayout; removed local duplicate */}

      {/* ------------------------------ */}
      {/* Main Content */}
      {/* ------------------------------ */}
      <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-6 px-6 py-8">

        {/* Loading / Error State */}
        {loading && (
          <div className="col-span-2 text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-bloomberg-blue"></div>
            <p className="mt-4 text-bloomberg-text">Loading live news...</p>
          </div>
        )}

        {error && !loading && (
          <div className="col-span-2 text-center py-20">
            <p className="text-bloomberg-red">Failed to load news. Showing fallback data.</p>
          </div>
        )}

        {/* ------------------------------ */}
        {/* News Feed (2 columns) */}
        {/* ------------------------------ */}
        {!loading && (
          <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {news.map((n: any, i) => (
              <div
                key={`${n.publishedAt || n.title}-${i}`}
                className={`bg-white border border-bloomberg-border overflow-hidden hover:border-bloomberg-blue transition-all duration-200 cursor-pointer ${
                  newArticleIds.has(n.title) ? 'animate-fade-in' : ''
                }`}
              >
                <div className="relative w-full h-40 bg-bloomberg-bg">
                  <img
                    src={n.img}
                    alt="news"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h2 className="text-base font-semibold text-bloomberg-headline leading-tight mb-2 line-clamp-2">
                    {n.title}
                  </h2>
                  <p className="text-sm text-bloomberg-text mb-3 line-clamp-3 leading-relaxed">
                    {n.summary}
                  </p>

                  <div className="flex items-center justify-between text-xs text-bloomberg-secondary">
                    <span>{n.source}</span>
                    <span>{n.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ------------------------------ */}
        {/* Sidebar */}
        {/* ------------------------------ */}
        <div className="space-y-6">
          {/* Market Overview Panel */}
          <MarketOverviewPanel />

          {/* Most Read */}
          <div className="bg-white border border-bloomberg-border p-5">
            <h3 className="text-base font-semibold text-bloomberg-headline mb-4">Most Read</h3>
            <ul className="space-y-3 text-sm text-bloomberg-text">
              <li className="hover:text-bloomberg-blue cursor-pointer transition">
                Market braces for key CPI data tomorrow
              </li>
              <li className="hover:text-bloomberg-blue cursor-pointer transition">
                Bitcoin liquidity hits all-time high
              </li>
              <li className="hover:text-bloomberg-blue cursor-pointer transition">
                Oil slides as global inventories expand
              </li>
              <li className="hover:text-bloomberg-blue cursor-pointer transition">
                Tech stocks recover ahead of earnings season
              </li>
            </ul>
          </div>

          {/* Top Movers */}
          <div className="bg-white border border-bloomberg-border p-5">
            <h3 className="text-base font-semibold text-bloomberg-headline mb-4">Top Movers</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between">
                <span className="text-bloomberg-headline">TSLA</span>
                <span className="text-bloomberg-green font-medium">+3.8%</span>
              </li>
              <li className="flex justify-between">
                <span className="text-bloomberg-headline">NFLX</span>
                <span className="text-bloomberg-green font-medium">+2.4%</span>
              </li>
              <li className="flex justify-between">
                <span className="text-bloomberg-headline">NVDA</span>
                <span className="text-bloomberg-negative font-medium">-1.2%</span>
              </li>
              <li className="flex justify-between">
                <span className="text-bloomberg-headline">AAPL</span>
                <span className="text-bloomberg-green font-medium">+0.9%</span>
              </li>
            </ul>
          </div>

        </div>
      </div>
    </div>
    </>
  );
}
