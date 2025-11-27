/**
 * Trading Strategies for Backtesting
 * Includes: EMA Crossover, SMA Crossover, RSI, MACD
 */

import { Candle } from "./dataProviders";
import { BacktestEngine } from "./backtestEngine";
import { calculateEMA, calculateSMA, calculateRSI, calculateMACD } from "./indicators";
import { GenericRulesParams } from './strategyParser';

export interface Strategy {
  name: string;
  execute(candles: Candle[], engine: BacktestEngine): void;
}

class GenericRuleStrategy implements Strategy {
  name = 'Generic Rules';
  private cfg: GenericRulesParams;
  constructor(cfg: GenericRulesParams) { this.cfg = cfg; }
  execute(candles: Candle[], engine: BacktestEngine): void {
    const closes = candles.map(c => c.close);
    const indicatorCache: Record<string, number[]> = {};
    for (const ind of this.cfg.indicators) {
      const key = JSON.stringify(ind);
      if (indicatorCache[key]) continue;
      let arr: number[] = [];
      switch (ind.indicator) {
        case 'ema': arr = calculateEMA(closes, ind.period || 9); break;
        case 'sma': arr = calculateSMA(closes, ind.period || 9); break;
        case 'rsi': arr = calculateRSI(closes, ind.period || 14); break;
        case 'macd': {
          const m = calculateMACD(closes, ind.fastPeriod || 12, ind.slowPeriod || 26, ind.signalPeriod || 9);
          arr = m.macd; indicatorCache[JSON.stringify({ ...ind, macdLine:true })] = m.signal;
        } break;
        case 'price': arr = closes.slice(); break;
        default: arr = closes.slice(); break;
      }
      indicatorCache[key] = arr;
    }
    function val(ind: any, i: number): number { return indicatorCache[JSON.stringify(ind)]?.[i]; }
    function passes(rule: any, i: number): boolean {
      const leftC = rule.left; const rightC = rule.right;
      const lNow = val(leftC, i); const lPrev = val(leftC, i-1);
      let rNow: number|undefined, rPrev: number|undefined;
      if (rightC && 'indicator' in rightC) { rNow = val(rightC, i); rPrev = val(rightC, i-1); } else if (rightC && 'value' in rightC) { rNow = rightC.value; rPrev = rightC.value; }
      if ([lNow,lPrev,rNow,rPrev].some(x => x === undefined || isNaN(x!))) return false;
      switch (rule.op) {
        case 'crossesAbove': return lPrev! <= rPrev! && lNow! > rNow!;
        case 'crossesBelow': return lPrev! >= rPrev! && lNow! < rNow!;
        case 'greaterThan': return lNow! > rNow!;
        case 'lessThan': return lNow! < rNow!;
        default: return false;
      }
    }
    const warmup = Math.max(...Object.values(indicatorCache).map(a => a.findIndex(v => !isNaN(v)) + 1));
    for (let i = warmup; i < candles.length; i++) {
      const price = candles[i].close; const time = candles[i].timestamp;
      if (!engine.hasPosition()) {
        if (this.cfg.entryRules.every(r => passes(r, i))) engine.openLong(price, time);
      } else {
        if (this.cfg.exitRules.some(r => passes(r, i))) engine.closePosition(price, time);
      }
      engine.updateEquity(price, time);
    }
    if (engine.hasPosition()) { const last = candles[candles.length-1]; engine.closePosition(last.close, last.timestamp); }
  }
}

/**
 * EMA Crossover Strategy
 * Buy when fast EMA crosses above slow EMA
 * Sell when fast EMA crosses below slow EMA
 */
export class EMACrossoverStrategy implements Strategy {
  name = "EMA Crossover";
  private fastPeriod: number;
  private slowPeriod: number;

  constructor(fastPeriod: number = 9, slowPeriod: number = 21) {
    this.fastPeriod = fastPeriod;
    this.slowPeriod = slowPeriod;
  }

  execute(candles: Candle[], engine: BacktestEngine): void {
    const closes = candles.map((c) => c.close);
    const fastEMA = calculateEMA(closes, this.fastPeriod);
    const slowEMA = calculateEMA(closes, this.slowPeriod);

    console.log(`[EMA Strategy] Analyzing ${candles.length} candles`);
    console.log(`[EMA Strategy] Fast EMA ${this.fastPeriod}, Slow EMA ${this.slowPeriod}`);
    
    let signals = 0;
    let bullishCrossovers = 0;
    let bearishCrossovers = 0;

    for (let i = this.slowPeriod; i < candles.length; i++) {
      const currentFast = fastEMA[i];
      const currentSlow = slowEMA[i];
      const prevFast = fastEMA[i - 1];
      const prevSlow = slowEMA[i - 1];

      if (isNaN(currentFast) || isNaN(currentSlow)) continue;

      const price = candles[i].close;
      const time = candles[i].timestamp;

      // Bullish crossover - buy signal
      if (prevFast <= prevSlow && currentFast > currentSlow) {
        bullishCrossovers++;
        if (!engine.hasPosition()) {
          const success = engine.openLong(price, time);
          if (success) signals++;
        }
      }

      // Bearish crossover - sell signal
      if (prevFast >= prevSlow && currentFast < currentSlow) {
        bearishCrossovers++;
        if (engine.hasPosition()) {
          engine.closePosition(price, time);
        }
      }

      // Update equity curve
      engine.updateEquity(price, time);
    }

    console.log(`[EMA Strategy] Bullish crossovers: ${bullishCrossovers}`);
    console.log(`[EMA Strategy] Bearish crossovers: ${bearishCrossovers}`);
    console.log(`[EMA Strategy] Trades opened: ${signals}`);

    // Close any remaining position at the end
    if (engine.hasPosition()) {
      const lastCandle = candles[candles.length - 1];
      engine.closePosition(lastCandle.close, lastCandle.timestamp);
      console.log(`[EMA Strategy] Closed remaining position at end`);
    }
  }
}

/**
 * SMA Crossover Strategy
 * Buy when fast SMA crosses above slow SMA
 * Sell when fast SMA crosses below slow SMA
 */
export class SMACrossoverStrategy implements Strategy {
  name = "SMA Crossover";
  private fastPeriod: number;
  private slowPeriod: number;

  constructor(fastPeriod: number = 10, slowPeriod: number = 30) {
    this.fastPeriod = fastPeriod;
    this.slowPeriod = slowPeriod;
  }

  execute(candles: Candle[], engine: BacktestEngine): void {
    const closes = candles.map((c) => c.close);
    const fastSMA = calculateSMA(closes, this.fastPeriod);
    const slowSMA = calculateSMA(closes, this.slowPeriod);

    for (let i = this.slowPeriod; i < candles.length; i++) {
      const currentFast = fastSMA[i];
      const currentSlow = slowSMA[i];
      const prevFast = fastSMA[i - 1];
      const prevSlow = slowSMA[i - 1];

      if (isNaN(currentFast) || isNaN(currentSlow)) continue;

      const price = candles[i].close;
      const time = candles[i].timestamp;

      // Bullish crossover
      if (prevFast <= prevSlow && currentFast > currentSlow) {
        if (!engine.hasPosition()) {
          engine.openLong(price, time);
        }
      }

      // Bearish crossover
      if (prevFast >= prevSlow && currentFast < currentSlow) {
        if (engine.hasPosition()) {
          engine.closePosition(price, time);
        }
      }

      engine.updateEquity(price, time);
    }

    // Close any remaining position
    if (engine.hasPosition()) {
      const lastCandle = candles[candles.length - 1];
      engine.closePosition(lastCandle.close, lastCandle.timestamp);
    }
  }
}

/**
 * RSI Strategy
 * Buy when RSI crosses below oversold level (default 30)
 * Sell when RSI crosses above overbought level (default 70)
 */
export class RSIStrategy implements Strategy {
  name = "RSI";
  private period: number;
  private oversold: number;
  private overbought: number;

  constructor(period: number = 14, oversold: number = 30, overbought: number = 70) {
    this.period = period;
    this.oversold = oversold;
    this.overbought = overbought;
  }

  execute(candles: Candle[], engine: BacktestEngine): void {
    const closes = candles.map((c) => c.close);
    const rsi = calculateRSI(closes, this.period);

    for (let i = this.period + 1; i < candles.length; i++) {
      const currentRSI = rsi[i];
      const prevRSI = rsi[i - 1];

      if (isNaN(currentRSI)) continue;

      const price = candles[i].close;
      const time = candles[i].timestamp;

      // Oversold - buy signal
      if (prevRSI <= this.oversold && currentRSI > this.oversold) {
        if (!engine.hasPosition()) {
          engine.openLong(price, time);
        }
      }

      // Overbought - sell signal
      if (prevRSI >= this.overbought && currentRSI < this.overbought) {
        if (engine.hasPosition()) {
          engine.closePosition(price, time);
        }
      }

      engine.updateEquity(price, time);
    }

    // Close any remaining position
    if (engine.hasPosition()) {
      const lastCandle = candles[candles.length - 1];
      engine.closePosition(lastCandle.close, lastCandle.timestamp);
    }
  }
}

/**
 * MACD Strategy
 * Buy when MACD line crosses above signal line
 * Sell when MACD line crosses below signal line
 */
export class MACDStrategy implements Strategy {
  name = "MACD";
  private fastPeriod: number;
  private slowPeriod: number;
  private signalPeriod: number;

  constructor(fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) {
    this.fastPeriod = fastPeriod;
    this.slowPeriod = slowPeriod;
    this.signalPeriod = signalPeriod;
  }

  execute(candles: Candle[], engine: BacktestEngine): void {
    const closes = candles.map((c) => c.close);
    const { macd, signal } = calculateMACD(
      closes,
      this.fastPeriod,
      this.slowPeriod,
      this.signalPeriod
    );

    const startIndex = this.slowPeriod + this.signalPeriod;

    for (let i = startIndex; i < candles.length; i++) {
      const currentMACD = macd[i];
      const currentSignal = signal[i];
      const prevMACD = macd[i - 1];
      const prevSignal = signal[i - 1];

      if (isNaN(currentMACD) || isNaN(currentSignal)) continue;

      const price = candles[i].close;
      const time = candles[i].timestamp;

      // Bullish crossover
      if (prevMACD <= prevSignal && currentMACD > currentSignal) {
        if (!engine.hasPosition()) {
          engine.openLong(price, time);
        }
      }

      // Bearish crossover
      if (prevMACD >= prevSignal && currentMACD < currentSignal) {
        if (engine.hasPosition()) {
          engine.closePosition(price, time);
        }
      }

      engine.updateEquity(price, time);
    }

    // Close any remaining position
    if (engine.hasPosition()) {
      const lastCandle = candles[candles.length - 1];
      engine.closePosition(lastCandle.close, lastCandle.timestamp);
    }
  }
}

/**
 * Mean Reversion Strategy
 * Uses Bollinger Bands for entry/exit
 */
export class MeanReversionStrategy implements Strategy {
  name = "Mean Reversion";
  private period: number;
  private stdDev: number;

  constructor(period: number = 20, stdDev: number = 2) {
    this.period = period;
    this.stdDev = stdDev;
  }

  execute(candles: Candle[], engine: BacktestEngine): void {
    const closes = candles.map((c) => c.close);
    
    // Calculate SMA
    const sma: number[] = [];
    for (let i = 0; i < closes.length; i++) {
      if (i < this.period - 1) {
        sma.push(NaN);
        continue;
      }
      let sum = 0;
      for (let j = 0; j < this.period; j++) {
        sum += closes[i - j];
      }
      sma.push(sum / this.period);
    }

    // Calculate Bollinger Bands
    const upper: number[] = [];
    const lower: number[] = [];

    for (let i = 0; i < closes.length; i++) {
      if (i < this.period - 1) {
        upper.push(NaN);
        lower.push(NaN);
        continue;
      }

      let sum = 0;
      for (let j = 0; j < this.period; j++) {
        sum += Math.pow(closes[i - j] - sma[i], 2);
      }
      const std = Math.sqrt(sum / this.period);

      upper.push(sma[i] + std * this.stdDev);
      lower.push(sma[i] - std * this.stdDev);
    }

    for (let i = this.period; i < candles.length; i++) {
      const price = candles[i].close;
      const time = candles[i].timestamp;

      if (isNaN(upper[i]) || isNaN(lower[i])) continue;

      // Buy when price touches lower band
      if (price <= lower[i] && !engine.hasPosition()) {
        engine.openLong(price, time);
      }

      // Sell when price touches upper band or middle band
      if (engine.hasPosition() && (price >= upper[i] || price >= sma[i])) {
        engine.closePosition(price, time);
      }

      engine.updateEquity(price, time);
    }

    // Close any remaining position
    if (engine.hasPosition()) {
      const lastCandle = candles[candles.length - 1];
      engine.closePosition(lastCandle.close, lastCandle.timestamp);
    }
  }
}

/**
 * Get strategy by name
 */
export function getStrategy(
  name: string,
  params?: any
): Strategy {
  switch (name.toLowerCase()) {
    case "ema_crossover":
    case "ema":
      return new EMACrossoverStrategy(
        params?.fastPeriod || 9,
        params?.slowPeriod || 21
      );

    case "sma_crossover":
    case "sma":
      return new SMACrossoverStrategy(
        params?.fastPeriod || 10,
        params?.slowPeriod || 30
      );

    case "rsi":
      return new RSIStrategy(
        params?.period || 14,
        params?.oversold || 30,
        params?.overbought || 70
      );

    case "macd":
      return new MACDStrategy(
        params?.fastPeriod || 12,
        params?.slowPeriod || 26,
        params?.signalPeriod || 9
      );

    case "mean_reversion":
      return new MeanReversionStrategy(
        params?.period || 20,
        params?.stdDev || 2
      );

    case 'generic_rules':
      return new GenericRuleStrategy(params as GenericRulesParams);

    default:
      // Default to EMA Crossover
      return new EMACrossoverStrategy(9, 21);
  }
}
