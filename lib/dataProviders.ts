/**
 * Data Providers for fetching OHLC data from various APIs
 * Supports: Binance, Finnhub, AlphaVantage
 */

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface DataProvider {
  fetchCandles(
    symbol: string,
    timeframe: string,
    startDate: string,
    endDate: string
  ): Promise<Candle[]>;
}

/**
 * Binance Data Provider (Free, no API key needed for public data)
 * Best for crypto pairs
 */
export class BinanceProvider implements DataProvider {
  private baseUrl = "https://api.binance.com/api/v3";

  private mapTimeframe(tf: string): string {
    const map: { [key: string]: string } = {
      "1m": "1m",
      "5m": "5m",
      "15m": "15m",
      "30m": "30m",
      "1h": "1h",
      "4h": "4h",
      "1d": "1d",
      "1w": "1w",
    };
    return map[tf] || "1h";
  }

  async fetchCandles(
    symbol: string,
    timeframe: string,
    startDate: string,
    endDate: string
  ): Promise<Candle[]> {
    try {
      const interval = this.mapTimeframe(timeframe);
      const startTime = new Date(startDate).getTime();
      const endTime = new Date(endDate).getTime();

      console.log(`[Binance] Fetching ${symbol} ${interval} from ${startDate} to ${endDate}`);
      console.log(`[Binance] Timestamp range: ${startTime} to ${endTime}`);

      // Binance has 1000 candle limit per request
      // We need to make multiple requests for longer periods
      const allCandles: Candle[] = [];
      let currentStart = startTime;
      const limit = 1000;

      while (currentStart < endTime) {
        const url = `${this.baseUrl}/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&startTime=${currentStart}&endTime=${endTime}&limit=${limit}`;

        const response = await fetch(url);
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[Binance] API Error:`, errorText);
          throw new Error(`Binance API error: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data || data.length === 0) {
          console.log(`[Binance] No more data available`);
          break;
        }

        console.log(`[Binance] Fetched ${data.length} candles, total: ${allCandles.length + data.length}`);

        const candles = data.map((k: any) => ({
          timestamp: k[0],
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
          volume: parseFloat(k[5]),
        }));

        allCandles.push(...candles);

        // If we got less than limit, we're done
        if (data.length < limit) {
          break;
        }

        // Move to next batch (use last candle timestamp + 1)
        currentStart = candles[candles.length - 1].timestamp + 1;
      }

      console.log(`[Binance] Total candles fetched: ${allCandles.length}`);
      
      if (allCandles.length === 0) {
        throw new Error(`No data returned from Binance for ${symbol}`);
      }

      return allCandles;
    } catch (error) {
      console.error("Binance fetch error:", error);
      throw error;
    }
  }
}

/**
 * Finnhub Data Provider (requires API key)
 * Good for stocks and forex
 */
export class FinnhubProvider implements DataProvider {
  private baseUrl = "https://finnhub.io/api/v1";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private mapTimeframe(tf: string): string {
    const map: { [key: string]: string } = {
      "1m": "1",
      "5m": "5",
      "15m": "15",
      "30m": "30",
      "1h": "60",
      "1d": "D",
      "1w": "W",
      "1M": "M",
    };
    return map[tf] || "60";
  }

  async fetchCandles(
    symbol: string,
    timeframe: string,
    startDate: string,
    endDate: string
  ): Promise<Candle[]> {
    try {
      const resolution = this.mapTimeframe(timeframe);
      const from = Math.floor(new Date(startDate).getTime() / 1000);
      const to = Math.floor(new Date(endDate).getTime() / 1000);

      const url = `${this.baseUrl}/stock/candle?symbol=${symbol.toUpperCase()}&resolution=${resolution}&from=${from}&to=${to}&token=${this.apiKey}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Finnhub API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.s === "no_data") {
        throw new Error("No data available for this symbol/timeframe");
      }

      const candles: Candle[] = [];
      for (let i = 0; i < data.t.length; i++) {
        candles.push({
          timestamp: data.t[i] * 1000,
          open: data.o[i],
          high: data.h[i],
          low: data.l[i],
          close: data.c[i],
          volume: data.v[i],
        });
      }

      return candles;
    } catch (error) {
      console.error("Finnhub fetch error:", error);
      throw error;
    }
  }
}

/**
 * AlphaVantage Data Provider (requires API key, free tier available)
 * Good for stocks
 */
export class AlphaVantageProvider implements DataProvider {
  private baseUrl = "https://www.alphavantage.co/query";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private mapTimeframe(tf: string): { func: string; interval?: string } {
    const map: { [key: string]: { func: string; interval?: string } } = {
      "1m": { func: "TIME_SERIES_INTRADAY", interval: "1min" },
      "5m": { func: "TIME_SERIES_INTRADAY", interval: "5min" },
      "15m": { func: "TIME_SERIES_INTRADAY", interval: "15min" },
      "30m": { func: "TIME_SERIES_INTRADAY", interval: "30min" },
      "1h": { func: "TIME_SERIES_INTRADAY", interval: "60min" },
      "1d": { func: "TIME_SERIES_DAILY" },
      "1w": { func: "TIME_SERIES_WEEKLY" },
      "1M": { func: "TIME_SERIES_MONTHLY" },
    };
    return map[tf] || { func: "TIME_SERIES_DAILY" };
  }

  async fetchCandles(
    symbol: string,
    timeframe: string,
    startDate: string,
    endDate: string
  ): Promise<Candle[]> {
    try {
      const { func, interval } = this.mapTimeframe(timeframe);
      let url = `${this.baseUrl}?function=${func}&symbol=${symbol.toUpperCase()}&apikey=${this.apiKey}&outputsize=full`;

      if (interval) {
        url += `&interval=${interval}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`AlphaVantage API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Find the time series key
      const timeSeriesKey = Object.keys(data).find((k) =>
        k.includes("Time Series")
      );
      if (!timeSeriesKey) {
        throw new Error("No time series data in response");
      }

      const timeSeries = data[timeSeriesKey];
      const candles: Candle[] = [];

      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();

      for (const [dateStr, values] of Object.entries(timeSeries)) {
        const timestamp = new Date(dateStr).getTime();
        if (timestamp >= start && timestamp <= end) {
          const v = values as any;
          candles.push({
            timestamp,
            open: parseFloat(v["1. open"]),
            high: parseFloat(v["2. high"]),
            low: parseFloat(v["3. low"]),
            close: parseFloat(v["4. close"]),
            volume: parseFloat(v["5. volume"] || v["6. volume"] || "0"),
          });
        }
      }

      // Sort by timestamp ascending
      candles.sort((a, b) => a.timestamp - b.timestamp);

      return candles;
    } catch (error) {
      console.error("AlphaVantage fetch error:", error);
      throw error;
    }
  }
}

/**
 * Factory function to get the appropriate data provider
 */
export function getDataProvider(provider: string = "binance"): DataProvider {
  switch (provider.toLowerCase()) {
    case "binance":
      return new BinanceProvider();
    case "finnhub":
      const finnhubKey = process.env.FINNHUB_API_KEY || "";
      return new FinnhubProvider(finnhubKey);
    case "alphavantage":
      const avKey = process.env.ALPHAVANTAGE_API_KEY || "";
      return new AlphaVantageProvider(avKey);
    default:
      return new BinanceProvider();
  }
}
