/**
 * Generate sample candle data for testing when API is unavailable
 */

export interface SampleCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Generate realistic BTC price movement for testing
 */
export function generateSampleData(
  startDate: string,
  endDate: string,
  timeframe: string = "1h"
): SampleCandle[] {
  const candles: SampleCandle[] = [];
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  // Timeframe in milliseconds
  const intervals: { [key: string]: number } = {
    "1m": 60 * 1000,
    "5m": 5 * 60 * 1000,
    "15m": 15 * 60 * 1000,
    "30m": 30 * 60 * 1000,
    "1h": 60 * 60 * 1000,
    "4h": 4 * 60 * 60 * 1000,
    "1d": 24 * 60 * 60 * 1000,
  };

  const interval = intervals[timeframe] || intervals["1h"];

  // Starting price around BTC's typical range
  let price = 42000;
  let timestamp = start;

  // Generate trend with some volatility
  const trendStrength = 0.0002; // Slight upward trend
  const volatility = 0.015; // 1.5% volatility

  while (timestamp <= end) {
    // Add trend and random walk
    const trend = price * trendStrength;
    const randomChange = price * volatility * (Math.random() - 0.5);
    
    const open = price;
    price = price + trend + randomChange;
    
    // Generate high and low
    const dayVolatility = price * 0.01;
    const high = price + Math.random() * dayVolatility;
    const low = price - Math.random() * dayVolatility;
    const close = low + Math.random() * (high - low);
    
    // Volume (random between 100-1000 BTC)
    const volume = 100 + Math.random() * 900;

    candles.push({
      timestamp,
      open,
      high,
      low,
      close,
      volume,
    });

    price = close;
    timestamp += interval;
  }

  return candles;
}
