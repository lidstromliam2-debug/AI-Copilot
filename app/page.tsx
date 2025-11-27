"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
// Image import removed (chart section deleted)

export default function Home() {
  const [news, setNews] = useState([]);
  // 'now' triggers re-render so relative times update without refetching
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch("/api/news");
        if (res.ok) {
          const data = await res.json();
          setNews(data.slice(0, 12)); // Latest 12 news
        }
      } catch (err) {
        console.error("Failed to fetch news:", err);
      }
    }
    fetchNews();
    // Poll news every 90s, and refresh clock every minute
    const newsInterval = setInterval(fetchNews, 90000);
    const clockInterval = setInterval(() => setNow(Date.now()), 60000);
    return () => {
      clearInterval(newsInterval);
      clearInterval(clockInterval);
    };
  }, []);

  // Calculate time since publication
  function timeSince(dateString: string) {
    const now = new Date();
    const published = new Date(dateString);
    const diffMs = now.getTime() - published.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.floor(diffHours / 24)}d`;
  }

  return (
    <div className="min-h-screen bg-bloomberg-bg">

      {/* HERO */}
      <div className="relative border-b border-bloomberg-border bg-hero bg-cover bg-center">
        {/* Dark professional overlay */}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/80 to-[#0a1624]/80" />
        <div className="relative max-w-[1280px] mx-auto px-6 py-20 z-10">
          <div className="grid lg:grid-cols-[1fr_340px] gap-8">
            {/* Main Hero Content */}
            <div className="max-w-3xl">
              <h1 className="text-5xl md:text-6xl font-semibold text-white leading-tight mb-6 tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                The AI trading platform built for professionals
              </h1>
              <p className="text-lg text-white/85 leading-relaxed mb-10 max-w-2xl drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)]">
                Chart analysis, market intelligence, risk management, and journaling—powered by AI. 
                Everything you need to trade smarter, all in one platform.
              </p>

              <div className="flex gap-3">
                <button
                  className="bg-black text-white px-6 py-3 font-medium hover:bg-bloomberg-btn-hover transition cursor-pointer"
                >
                  Start now
                </button>
              </div>

              {/* Featured 2x2 News Grid */}
              {news.length >= 4 && (
                <div className="mt-12">
                  <h2 className="text-xs font-semibold tracking-wider text-white/75 uppercase mb-4">Market Headlines</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {news.slice(0,4).map((article: any, i: number) => {
                      const imgSrc = article.image || article.img || null;
                      const alt = article.title || 'headline';
                      return (
                        <a
                          key={i}
                          href={article.url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group border border-black/10 rounded-md bg-white hover:border-bloomberg-blue/60 hover:shadow-sm transition flex flex-col overflow-hidden"
                        >
                          {imgSrc ? (
                            <div className="relative w-full h-32 mb-3 bg-bloomberg-bg">
                              <Image
                                src={imgSrc}
                                alt={alt}
                                fill
                                sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 33vw"
                                className="object-cover"
                                priority={i===0}
                              />
                            </div>
                          ) : (
                            <div className="w-full h-32 mb-3 bg-gradient-to-br from-black/5 to-black/10 flex items-center justify-center text-[10px] text-bloomberg-secondary">No image</div>
                          )}
                          <div className="px-4 pb-4 flex flex-col flex-grow">
                            <h3 className="text-[13px] font-medium text-bloomberg-headline leading-snug mb-3 group-hover:text-bloomberg-blue line-clamp-3">
                              {article.title}
                            </h3>
                            <div className="mt-auto flex items-center justify-between text-[10px] font-medium text-bloomberg-secondary px-0">
                              <span>{timeSince(article.publishedAt)}</span>
                              {article.source && <span className="truncate max-w-[70px]">{article.source}</span>}
                            </div>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Latest News Sidebar */}
            <div className="bg-white/95 backdrop-blur-sm border border-black/10 rounded-sm">
              <div className="border-b border-black/10 px-5 py-3.5">
                <h2 className="text-sm font-semibold text-[#D7373F] uppercase tracking-wider">Latest</h2>
              </div>
              <div className="divide-y divide-black/5">
                {news.length > 0 ? (
                  news.map((article: any, i: number) => (
                    <a
                      key={i}
                      href={article.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-5 py-3.5 hover:bg-bloomberg-bg transition group"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-[10px] font-medium text-bloomberg-secondary uppercase tracking-wide flex-shrink-0 mt-0.5">
                          {timeSince(article.publishedAt)}
                        </span>
                        <h3 className="text-[13px] font-medium text-bloomberg-headline leading-snug group-hover:text-bloomberg-blue transition line-clamp-2">
                          {article.title}
                        </h3>
                      </div>
                    </a>
                  ))
                ) : (
                  <div className="px-5 py-8 text-center text-xs text-bloomberg-secondary">
                    Loading news...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CHART SECTION REMOVED */}

      {/* FEATURES */}
      <section className="relative bg-gradient-to-b from-white to-[#F6F7FB] py-24">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Trading Journal */}
            <div className="bg-white rounded-xl border border-black/5 shadow-[0_6px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.10)] transition-all duration-200 p-8 flex flex-col min-h-[300px]">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-black/5 text-black flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 7h16"/><path d="M8 3v4"/><path d="M16 3v4"/><rect x="4" y="7" width="16" height="14" rx="2"/><path d="M8 11h8"/><path d="M8 15h5"/>
                  </svg>
                </div>
                <h3 className="text-[18px] font-semibold text-bloomberg-headline">Trading Journal</h3>
              </div>
              <p className="text-sm text-bloomberg-text leading-relaxed mb-8">
                Log and analyze your trades with performance insights and strategy tracking.
              </p>
              <div className="mt-auto">
                <a href="/journal" className="w-full inline-flex items-center justify-center rounded-md bg-black text-white px-4 py-2.5 text-sm font-medium hover:bg-bloomberg-btn-hover transition">
                  Open Journal
                </a>
              </div>
            </div>

            {/* Market News */}
            <div className="bg-white rounded-xl border border-black/5 shadow-[0_6px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.10)] transition-all duration-200 p-8 flex flex-col min-h-[300px]">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-black/5 text-black flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 5h14a2 2 0 0 1 2 2v10"/><path d="M4 5v12a2 2 0 0 0 2 2h12"/><path d="M8 8h8"/><path d="M8 12h8"/><path d="M8 16h5"/>
                  </svg>
                </div>
                <h3 className="text-[18px] font-semibold text-bloomberg-headline">Market News</h3>
              </div>
              <p className="text-sm text-bloomberg-text leading-relaxed mb-8">
                Stay updated with real-time headlines and automated sentiment signals.
              </p>
              <div className="mt-auto">
                <a href="/market" className="w-full inline-flex items-center justify-center rounded-md bg-black text-white px-4 py-2.5 text-sm font-medium hover:bg-bloomberg-btn-hover transition">
                  Explore News
                </a>
              </div>
            </div>

            {/* AI Copilot */}
            <div className="bg-white rounded-xl border border-black/5 shadow-[0_6px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.10)] transition-all duration-200 p-8 flex flex-col min-h-[300px]">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-black/5 text-black flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/><path d="M7 8a4.5 4.5 0 0 1 10 0"/><path d="M7 16a4.5 4.5 0 0 0 10 0"/>
                  </svg>
                </div>
                <h3 className="text-[18px] font-semibold text-bloomberg-headline">AI Copilot</h3>
              </div>
              <p className="text-sm text-bloomberg-text leading-relaxed mb-8">
                Upload charts and receive instant analysis, trade setups and risk insights.
              </p>
              <div className="mt-auto">
                <a href="/copilot" className="w-full inline-flex items-center justify-center rounded-md bg-black text-white px-4 py-2.5 text-sm font-medium hover:bg-bloomberg-btn-hover transition">
                  Go to Copilot
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="border-t border-bloomberg-border bg-white py-14">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            <div>
              <div className="text-4xl font-semibold text-bloomberg-headline mb-2">10,000+</div>
              <div className="text-sm text-bloomberg-text">Active Traders</div>
            </div>
            <div>
              <div className="text-4xl font-semibold text-bloomberg-headline mb-2">2M+</div>
              <div className="text-sm text-bloomberg-text">Trades Analyzed</div>
            </div>
            <div>
              <div className="text-4xl font-semibold text-bloomberg-headline mb-2">99.9%</div>
              <div className="text-sm text-bloomberg-text">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-bloomberg-border bg-white py-8">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-bloomberg-black flex items-center justify-center">
                <span className="text-white font-bold text-[10px]">Q</span>
              </div>
              <span className="text-bloomberg-secondary text-xs">© {new Date().getFullYear()} Quantpilot. All rights reserved.</span>
            </div>
            <div className="flex gap-6 text-xs text-bloomberg-text">
              <a href="/pricing" className="hover:text-bloomberg-blue transition">Pricing</a>
              <a href="/docs" className="hover:text-bloomberg-blue transition">Docs</a>
              <a href="/blog" className="hover:text-bloomberg-blue transition">Blog</a>
              <a href="/support" className="hover:text-bloomberg-blue transition">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
