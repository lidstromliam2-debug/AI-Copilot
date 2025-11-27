import { NextResponse } from "next/server";
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Lightweight manual timeout helper (AbortSignal.timeout not guaranteed in current runtime)
function withTimeout<T>(ms: number, op: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("timeout")), ms);
    op.then(v => { clearTimeout(id); resolve(v); }).catch(e => { clearTimeout(id); reject(e); });
  });
}

// In-memory cache to avoid hammering providers every 5s from multiple clients
interface CacheEntry { data: any; ts: number; }
let cache: CacheEntry | null = null;
const CACHE_TTL_MS = 4000; // Keep just under client 5s polling

export async function GET(req: Request) {
  const start = Date.now();
  console.log('[TICKERS] start', new Date().toISOString());
  try {
    const finnhubKey = process.env.FINNHUB_API_KEY;
    // Serve cached if fresh AND no need to refresh zeros with Finnhub
    if (cache && Date.now() - cache.ts < CACHE_TTL_MS) {
      const hasZeroEquities = cache.data.some((t: any) => ["AAPL","TSLA","NVDA"].includes(t.symbol) && Math.abs(t.change) < 0.0001);
      if (!(finnhubKey && hasZeroEquities)) {
        return NextResponse.json(cache.data);
      }
      // fall through to refetch to attempt filling zeros
    }

    const url = new URL(req.url);
    const debug = url.searchParams.get("debug") === "1";

    // Helper for timed fetch JSON
    async function fetchJson(url: string, opts: any, timeoutMs: number): Promise<any|null> {
      try {
        const r: any = await withTimeout(timeoutMs, fetch(url, opts));
        if (!r.ok) return null; return await r.json();
      } catch { return null; }
    }

    const symbols = "^GSPC,^IXIC,^DJI,GC=F,CL=F,DX-Y.NYB,AAPL,TSLA,NVDA";
    // Run in parallel with shorter timeouts
    const [cryptoData, stocksData] = await Promise.all([
      fetchJson("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true", undefined, 2000),
      fetchJson(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`, { headers: { "User-Agent": "Mozilla/5.0 (TickerUpdater)" } }, 2000)
    ]);
    const quotes = stocksData?.quoteResponse?.result || [];
    if (quotes.length === 0 && Date.now() - start > 2200) {
      console.log('[TICKERS] external data unavailable, serving fallback');
      const fallback = [
        { symbol: 'SPX', change: 0 },
        { symbol: 'NAS', change: 0 },
        { symbol: 'DOW', change: 0 },
        { symbol: 'GOLD', change: 0 },
        { symbol: 'OIL', change: 0 },
        { symbol: 'BTC', change: 0 },
        { symbol: 'ETH', change: 0 },
        { symbol: 'DXY', change: 0 },
        { symbol: 'AAPL', change: 0 },
        { symbol: 'TSLA', change: 0 },
        { symbol: 'NVDA', change: 0 }
      ];
      cache = { data: fallback, ts: Date.now() };
      return NextResponse.json(fallback);
    }

    // quotes already derived above

    // Helper: derive percent change reliably
    function pct(symbol: string): number {
      const q: any = quotes.find((qq: any) => qq.symbol === symbol);
      if (!q) return NaN;
      let value = q.regularMarketChangePercent;
      // Prefer post-market percent if regular is near zero but postMarketChangePercent exists
      if ((value === undefined || value === null || Math.abs(value) < 0.0001) && typeof q.postMarketChangePercent === "number" && Math.abs(q.postMarketChangePercent) > 0.0001) {
        value = q.postMarketChangePercent;
      }
      // Compute manually if still missing
      if ((value === undefined || value === null || Math.abs(value) < 0.0001) && typeof q.regularMarketChange === "number" && typeof q.regularMarketPreviousClose === "number" && q.regularMarketPreviousClose !== 0) {
        value = (q.regularMarketChange / q.regularMarketPreviousClose) * 100;
      }
      if (value === undefined || value === null || isNaN(value)) return NaN;
      return parseFloat(value.toFixed(2));
    }

    // Build ticker array
    let tickers = [
      { symbol: "SPX", change: pct("^GSPC") },
      { symbol: "NAS", change: pct("^IXIC") },
      { symbol: "DOW", change: pct("^DJI") },
      { symbol: "GOLD", change: pct("GC=F") },
      { symbol: "OIL", change: pct("CL=F") },
      { symbol: "BTC", change: parseFloat((cryptoData?.bitcoin?.usd_24h_change ?? 0).toFixed(2)) },
      { symbol: "ETH", change: parseFloat((cryptoData?.ethereum?.usd_24h_change ?? 0).toFixed(2)) },
      { symbol: "DXY", change: pct("DX-Y.NYB") || pct("DXY") },
      { symbol: "AAPL", change: pct("AAPL") },
      { symbol: "TSLA", change: pct("TSLA") },
      { symbol: "NVDA", change: pct("NVDA") },
    ];

    // Finnhub fallback for zero/NaN equity/indices values
    // Finnhub key already read above for cache bypass logic
    async function finnhubQuote(sym: string): Promise<number | null> {
      if (!finnhubKey) return null;
      try {
        const r = await withTimeout(2500, fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(sym)}&token=${finnhubKey}`));
        if (!(r as any).ok) return null;
        const j = await (r as any).json();
        if (typeof j.dp === "number" && Math.abs(j.dp) > 0.0001) return parseFloat(j.dp.toFixed(2));
        return null;
      } catch { return null; }
    }

    // Enhanced equity percent: compute (c - pc)/pc even if dp is 0
    async function finnhubEquityPercent(sym: string): Promise<number | null> {
      if (!finnhubKey) return null;
      try {
        const r = await withTimeout(2500, fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(sym)}&token=${finnhubKey}`));
        if (!(r as any).ok) return null;
        const j = await (r as any).json();
        if (typeof j.c === 'number' && typeof j.pc === 'number' && j.pc !== 0) {
          const calc = ((j.c - j.pc) / j.pc) * 100;
          return parseFloat(calc.toFixed(2));
        }
        return null;
      } catch { return null; }
    }

    // Map Finnhub symbols
    const finnhubMap: Record<string,string> = {
      SPX: "^GSPC",
      NAS: "^IXIC",
      DOW: "^DJI",
      GOLD: "GC=F",
      OIL: "CL=F",
      DXY: "DX-Y.NYB", // attempt; may not exist, Finnhub might ignore
      AAPL: "AAPL",
      TSLA: "TSLA",
      NVDA: "NVDA"
    };

    // Always override equities with Finnhub computed percent if key present (more accurate intraday)
    if (finnhubKey) {
      const overrideSymbols = ["AAPL","TSLA","NVDA"];
      const results = await Promise.all(overrideSymbols.map(s => finnhubEquityPercent(finnhubMap[s])));
      results.forEach((val, idx) => {
        const sym = overrideSymbols[idx];
        if (val !== null && !isNaN(val)) {
          const target = tickers.find(t => t.symbol === sym);
          if (target) target.change = val;
        }
      });
      // For indices if zero, attempt Finnhub dp
      const indexFallback = tickers.filter(t => ["SPX","NAS","DOW"].includes(t.symbol) && Math.abs(t.change) < 0.0001);
      if (indexFallback.length) {
        const indexResults = await Promise.all(indexFallback.map(t => finnhubQuote(finnhubMap[t.symbol])));
        indexFallback.forEach((t, idx) => {
          const v = indexResults[idx];
          if (v !== null) t.change = v;
        });
      }
    }

    tickers = tickers.map(t => ({ symbol: t.symbol, change: isNaN(t.change) ? 0 : t.change }));

    cache = { data: tickers, ts: Date.now() };

    if (debug) {
      // Collect raw quote objects for symbols that ended up zero
      const zeroSymbols = tickers.filter(t => Math.abs(t.change) < 0.0001).map(t => t.symbol);
      const raw = quotes.filter((q: any) => zeroSymbols.includes(q.symbol) || zeroSymbols.includes(symbolAlias(q.symbol)));
      return NextResponse.json({ tickers, raw });
    }

    return NextResponse.json(tickers);
  } catch (err: any) {
    console.error("TICKERS API ERROR:", err);
    
    // Return mock data on error
    return NextResponse.json([
      { symbol: "SPX", change: +0.42 },
      { symbol: "NAS", change: +1.12 },
      { symbol: "DOW", change: -0.24 },
      { symbol: "GOLD", change: +0.88 },
      { symbol: "OIL", change: -1.11 },
      { symbol: "BTC", change: +2.94 },
      { symbol: "ETH", change: +1.33 },
      { symbol: "DXY", change: -0.44 },
      { symbol: "AAPL", change: 0 },
      { symbol: "TSLA", change: 0 },
      { symbol: "NVDA", change: 0 },
    ]);
  }
}

// Helper to map underlying Yahoo symbols back to our short format
function symbolAlias(sym: string): string {
  switch(sym) {
    case '^GSPC': return 'SPX';
    case '^IXIC': return 'NAS';
    case '^DJI': return 'DOW';
    case 'GC=F': return 'GOLD';
    case 'CL=F': return 'OIL';
    case 'DX-Y.NYB': return 'DXY';
    default: return sym;
  }
}
