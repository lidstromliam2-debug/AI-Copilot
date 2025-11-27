"use client";

import { useEffect, useState } from "react";

interface TickerItem {
  symbol: string;
  change: number;
}

export default function TickerMarquee() {
  const [tickers, setTickers] = useState<TickerItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchTickers() {
      try {
        const res = await fetch("/api/tickers");
        if (!res.ok) throw new Error("Bad response");
        const data = await res.json();
        if (mounted) {
          setTickers(data);
          setError(null);
        }
      } catch (e: any) {
        if (mounted) setError(e.message || "Ticker error");
      }
    }
    fetchTickers();
    const interval = setInterval(fetchTickers, 5000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const content = tickers.length === 0 ? (
    <div className="flex items-center gap-4 text-xs text-bloomberg-secondary">
      <span>Loading market data...</span>
      {error && <span className="text-bloomberg-negative">{error}</span>}
    </div>
  ) : (
    <>
      <div className="ticker-group">
        {tickers.map((t, i) => (
          <div key={`t-a-${i}`} className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wide text-bloomberg-headline">{t.symbol}</span>
            <span className={`text-xs font-medium ${t.change > 0 ? "text-bloomberg-green" : "text-bloomberg-negative"}`}>
              {t.change > 0 ? "+" : ""}{t.change}%
            </span>
          </div>
        ))}
      </div>
      <div className="ticker-group" aria-hidden>
        {tickers.map((t, i) => (
          <div key={`t-b-${i}`} className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wide text-bloomberg-headline">{t.symbol}</span>
            <span className={`text-xs font-medium ${t.change > 0 ? "text-bloomberg-green" : "text-bloomberg-negative"}`}>
              {t.change > 0 ? "+" : ""}{t.change}%
            </span>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <div className="border-b border-bloomberg-border bg-white py-2.5 px-4 ticker-container">
      <div className="ticker-track">
        {content}
      </div>
    </div>
  );
}
