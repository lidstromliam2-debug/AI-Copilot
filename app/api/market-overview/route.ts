import { NextResponse } from "next/server";

interface CacheEntry { data: any; ts: number; }
let cache: CacheEntry | null = null;
const CACHE_TTL_MS = 10000; // 10s cache

// Yahoo symbols we need
// Indices: SP500 ^GSPC, NASDAQ ^IXIC, DOW ^DJI, DAX ^GDAXI, FTSE ^FTSE
// Commodities: Gold GC=F, Oil CL=F, NatGas NG=F
// FX: EURUSD=X, GBPUSD=X, USDJPY=X
// Equities for gainers/losers sample: AAPL, TSLA, NVDA, MSFT, GOOGL, AMZN, META, NFLX
const YAHOO_SYMBOLS = "^GSPC,^IXIC,^DJI,^GDAXI,^FTSE,GC=F,CL=F,NG=F,EURUSD=X,GBPUSD=X,USDJPY=X,AAPL,TSLA,NVDA,MSFT,GOOGL,AMZN,META,NFLX";

function pctFromQuote(q: any): number {
  if (!q) return NaN;
  let v = q.regularMarketChangePercent;
  if ((v === null || v === undefined || Math.abs(v) < 0.0001) && typeof q.postMarketChangePercent === 'number' && Math.abs(q.postMarketChangePercent) > 0.0001) {
    v = q.postMarketChangePercent;
  }
  if ((v === null || v === undefined || Math.abs(v) < 0.0001) && typeof q.regularMarketChange === 'number' && typeof q.regularMarketPreviousClose === 'number' && q.regularMarketPreviousClose) {
    v = (q.regularMarketChange / q.regularMarketPreviousClose) * 100;
  }
  if (v === null || v === undefined || isNaN(v)) return 0;
  return parseFloat(v.toFixed(2));
}

function priceFromQuote(q: any): number | null {
  if (!q) return null;
  const p = q.regularMarketPrice ?? q.postMarketPrice ?? q.previousClose;
  return p ? parseFloat(p.toFixed(2)) : null;
}

export async function GET() {
  try {
    if (cache && Date.now() - cache.ts < CACHE_TTL_MS) {
      return NextResponse.json(cache.data);
    }

    // Fetch Yahoo bulk data
    const yahooRes = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${YAHOO_SYMBOLS}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (MarketOverview)' }
    });
    const yahooJson = await yahooRes.json();
    const quotes: any[] = yahooJson?.quoteResponse?.result || [];

    const bySymbol: Record<string, any> = {};
    quotes.forEach(q => { bySymbol[q.symbol] = q; });

    // Crypto (CoinGecko) BTC ETH SOL
    const cgRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true');
    const cgJson = await cgRes.json();

    const indices = [
      { symbol: 'SP500', base: '^GSPC' },
      { symbol: 'NASDAQ', base: '^IXIC' },
      { symbol: 'DOW', base: '^DJI' },
      { symbol: 'DAX', base: '^GDAXI' },
      { symbol: 'FTSE', base: '^FTSE' }
    ].map(i => ({
      symbol: i.symbol,
      change: pctFromQuote(bySymbol[i.base]),
      price: priceFromQuote(bySymbol[i.base])
    }));

    const commodities = [
      { symbol: 'Gold', base: 'GC=F' },
      { symbol: 'Oil', base: 'CL=F' },
      { symbol: 'NatGas', base: 'NG=F' }
    ].map(c => ({ symbol: c.symbol, change: pctFromQuote(bySymbol[c.base]), price: priceFromQuote(bySymbol[c.base]) }));

    const fx = [
      { symbol: 'EUR/USD', base: 'EURUSD=X' },
      { symbol: 'GBP/USD', base: 'GBPUSD=X' },
      { symbol: 'USD/JPY', base: 'USDJPY=X' }
    ].map(f => ({ symbol: f.symbol, change: pctFromQuote(bySymbol[f.base]), price: priceFromQuote(bySymbol[f.base]) }));

    const crypto = [
      { symbol: 'BTC', change: parseFloat((cgJson?.bitcoin?.usd_24h_change ?? 0).toFixed(2)), price: cgJson?.bitcoin?.usd ?? null },
      { symbol: 'ETH', change: parseFloat((cgJson?.ethereum?.usd_24h_change ?? 0).toFixed(2)), price: cgJson?.ethereum?.usd ?? null },
      { symbol: 'SOL', change: parseFloat((cgJson?.solana?.usd_24h_change ?? 0).toFixed(2)), price: cgJson?.solana?.usd ?? null }
    ];

    // Equities sample for gainers/losers
    const equities = ['AAPL','TSLA','NVDA','MSFT','GOOGL','AMZN','META','NFLX'].map(s => ({ symbol: s, change: pctFromQuote(bySymbol[s]), price: priceFromQuote(bySymbol[s]) }));

    // Combine for ranking (include crypto optionally)
    const universe = [...equities, ...crypto];
    const sorted = [...universe].sort((a,b) => b.change - a.change);
    const gainers = sorted.slice(0,3);
    const losers = [...universe].sort((a,b) => a.change - b.change).slice(0,3);

    const payload = { indices, commodities, fx, crypto, gainers, losers, timestamp: Date.now() };
    cache = { data: payload, ts: Date.now() };
    return NextResponse.json(payload);
  } catch (err: any) {
    console.error('MARKET_OVERVIEW_ERROR', err);
    return NextResponse.json({ error: 'Failed to load market overview' }, { status: 500 });
  }
}
