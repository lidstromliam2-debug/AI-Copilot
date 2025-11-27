/**
 * Technical Indicators for Backtesting
 * Implements: EMA, SMA, RSI, ATR
 */

import { Candle } from "./dataProviders";

/**
 * Simple Moving Average (SMA)
 */
export function calculateSMA(data: number[], period: number): number[] {
  const result: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
      continue;
    }

    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j];
    }
    result.push(sum / period);
  }

  return result;
}

/**
 * Exponential Moving Average (EMA)
 */
export function calculateEMA(data: number[], period: number): number[] {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);

  // Start with SMA for first value
  let sum = 0;
  for (let i = 0; i < period; i++) {
    if (i >= data.length) {
      result.push(NaN);
      continue;
    }
    sum += data[i];
    if (i < period - 1) {
      result.push(NaN);
    }
  }

  if (data.length >= period) {
    result[period - 1] = sum / period;
  }

  // Calculate EMA
  for (let i = period; i < data.length; i++) {
    const ema = (data[i] - result[i - 1]) * multiplier + result[i - 1];
    result.push(ema);
  }

  return result;
}

/**
 * Relative Strength Index (RSI)
 */
export function calculateRSI(data: number[], period: number = 14): number[] {
  const result: number[] = [];

  if (data.length < period + 1) {
    return data.map(() => NaN);
  }

  const gains: number[] = [];
  const losses: number[] = [];

  // Calculate price changes
  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
  }

  // First RSI value uses SMA
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 0; i < period; i++) {
    avgGain += gains[i];
    avgLoss += losses[i];
  }

  avgGain /= period;
  avgLoss /= period;

  result.push(NaN); // First value is NaN

  for (let i = 0; i < period; i++) {
    result.push(NaN);
  }

  const rs = avgGain / (avgLoss || 1);
  const rsi = 100 - 100 / (1 + rs);
  result.push(rsi);

  // Subsequent RSI values use EMA
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

    const rs = avgGain / (avgLoss || 1);
    const rsi = 100 - 100 / (1 + rs);
    result.push(rsi);
  }

  return result;
}

/**
 * Average True Range (ATR)
 */
export function calculateATR(candles: Candle[], period: number = 14): number[] {
  const result: number[] = [];

  if (candles.length < 2) {
    return candles.map(() => NaN);
  }

  const trueRanges: number[] = [NaN]; // First candle has no previous close

  // Calculate True Range for each candle
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );

    trueRanges.push(tr);
  }

  // First ATR is SMA of true ranges
  for (let i = 0; i < period; i++) {
    result.push(NaN);
  }

  let sum = 0;
  for (let i = 1; i <= period; i++) {
    sum += trueRanges[i];
  }

  let atr = sum / period;
  result.push(atr);

  // Subsequent ATR values use smoothing
  for (let i = period + 1; i < trueRanges.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period;
    result.push(atr);
  }

  return result;
}

/**
 * Bollinger Bands
 */
export function calculateBollingerBands(
  data: number[],
  period: number = 20,
  stdDev: number = 2
): { upper: number[]; middle: number[]; lower: number[] } {
  const middle = calculateSMA(data, period);
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(NaN);
      lower.push(NaN);
      continue;
    }

    // Calculate standard deviation
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += Math.pow(data[i - j] - middle[i], 2);
    }
    const std = Math.sqrt(sum / period);

    upper.push(middle[i] + std * stdDev);
    lower.push(middle[i] - std * stdDev);
  }

  return { upper, middle, lower };
}

/**
 * MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(
  data: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macd: number[]; signal: number[]; histogram: number[] } {
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);

  const macd: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (isNaN(fastEMA[i]) || isNaN(slowEMA[i])) {
      macd.push(NaN);
    } else {
      macd.push(fastEMA[i] - slowEMA[i]);
    }
  }

  const signal = calculateEMA(macd.filter((v) => !isNaN(v)), signalPeriod);

  // Pad signal array to match length
  const paddedSignal: number[] = [];
  let signalIndex = 0;
  for (let i = 0; i < macd.length; i++) {
    if (isNaN(macd[i])) {
      paddedSignal.push(NaN);
    } else {
      paddedSignal.push(signal[signalIndex] || NaN);
      signalIndex++;
    }
  }

  const histogram: number[] = [];
  for (let i = 0; i < macd.length; i++) {
    if (isNaN(macd[i]) || isNaN(paddedSignal[i])) {
      histogram.push(NaN);
    } else {
      histogram.push(macd[i] - paddedSignal[i]);
    }
  }

  return { macd, signal: paddedSignal, histogram };
}

/**
 * Stochastic Oscillator
 */
export function calculateStochastic(
  candles: Candle[],
  period: number = 14,
  smoothK: number = 3,
  smoothD: number = 3
): { k: number[]; d: number[] } {
  const k: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      k.push(NaN);
      continue;
    }

    let highest = -Infinity;
    let lowest = Infinity;

    for (let j = 0; j < period; j++) {
      const idx = i - j;
      highest = Math.max(highest, candles[idx].high);
      lowest = Math.min(lowest, candles[idx].low);
    }

    const current = candles[i].close;
    const stoch = ((current - lowest) / (highest - lowest || 1)) * 100;
    k.push(stoch);
  }

  // Smooth %K
  const smoothedK = calculateSMA(k, smoothK);

  // %D is SMA of %K
  const d = calculateSMA(smoothedK, smoothD);

  return { k: smoothedK, d };
}
