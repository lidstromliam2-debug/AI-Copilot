"use client";
import { useEffect, useState } from "react";

interface Item { symbol: string; change: number; price?: number | null; }
interface Overview {
  indices: Item[];
  commodities: Item[];
  fx: Item[];
  crypto: Item[];
  gainers: Item[];
  losers: Item[];
  timestamp: number;
}

function cls(change: number) {
  if (change > 0) return 'text-bloomberg-green';
  if (change < 0) return 'text-bloomberg-negative';
  return 'text-bloomberg-secondary';
}

function Arrow({ change }: { change: number }) {
  if (change > 0) return <svg className="w-3 h-3 text-bloomberg-green" fill="currentColor" viewBox="0 0 12 12"><path d="M6 2l4 4H2z"/></svg>;
  if (change < 0) return <svg className="w-3 h-3 text-bloomberg-negative" fill="currentColor" viewBox="0 0 12 12"><path d="M6 10L2 6h8z"/></svg>;
  return null;
}

function formatPrice(price: number | null | undefined, decimals = 2): string {
  if (price === null || price === undefined) return '—';
  return price.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export default function MarketOverviewPanel() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      try {
        const res = await fetch('/api/market-overview');
        if (!res.ok) throw new Error('Bad response');
        const json = await res.json();
        if (mounted) { setData(json); setError(null); }
      } catch (e: any) {
        if (mounted) setError(e.message || 'Error');
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 10000); // 10s refresh
    const clock = setInterval(() => setNow(Date.now()), 60000); // update relative time every min
    return () => { mounted = false; clearInterval(interval); clearInterval(clock); };
  }, []);

  function timeAgo(ts: number) {
    const diff = now - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins/60); return `${hrs}h ago`;
  }

  const section = (title: string, items: Item[], layout: 'grid' | 'list' = 'grid', showPrice = false) => (
    <div className="bg-white border border-black/10 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
      <h3 className="text-[11px] font-semibold tracking-wider uppercase text-bloomberg-secondary mb-4 border-b border-black/5 pb-2">{title}</h3>
      <div className={layout === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-3'}>
        {items.map(it => (
          <div key={it.symbol} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wide text-bloomberg-headline uppercase">{it.symbol}</span>
              <div className="flex items-center gap-1">
                <Arrow change={it.change} />
                <span className={`text-[11px] font-semibold ${cls(it.change)}`}>{it.change > 0 ? '+' : ''}{it.change}%</span>
              </div>
            </div>
            {showPrice && it.price !== null && it.price !== undefined && (
              <span className="text-[13px] font-medium text-bloomberg-text">{formatPrice(it.price, it.symbol.includes('/') ? 4 : 2)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  if (!data) {
    return (
      <div className="bg-white border border-black/10 rounded-lg p-6 text-center text-sm text-bloomberg-secondary">
        {error ? `Failed to load: ${error}` : 'Loading market overview...'}
      </div>
    );
  }

  return (
    <div className="space-y-6" aria-live="polite">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-semibold text-bloomberg-headline tracking-tight">Market Overview</h2>
        <span className="text-[10px] text-bloomberg-secondary flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-bloomberg-green animate-pulse" />
          Updated {timeAgo(data.timestamp)}
        </span>
      </div>
      <div className="grid gap-5">
        {section('Top Gainers', data.gainers.slice(0,5), 'list', true)}
        {section('Top Losers', data.losers.slice(0,5), 'list', true)}
      </div>
      <div className="grid gap-5">
        {section('Indices', data.indices, 'grid', true)}
        {section('Commodities', data.commodities, 'grid', true)}
        {section('FX', data.fx, 'grid', true)}
        {section('Crypto', data.crypto, 'grid', true)}
      </div>
    </div>
  );
}
