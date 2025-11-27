/**
 * API Route: /api/backtest
 * Full backtest with dynamic AI strategy parsing.
 * Flow:
 * 1. If prompt provided -> try parseNaturalLanguageStrategy (generic_rules)
 * 2. If fail -> use QUANT systemPrompt to get custom_ai_strategy JSON and heuristically convert to generic_rules
 * 3. If still fail -> fall back to preset mapping (if preset specified) else ema_crossover default
 * 4. Fetch candles, execute strategy, return full performance results + original AI interpretation.
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getDataProvider } from "@/lib/dataProviders";
import { BacktestEngine } from "@/lib/backtestEngine";
import { getStrategy } from "@/lib/strategies";
import { parseNaturalLanguageStrategy } from "@/lib/strategyParser";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

// System prompt as provided (verbatim except minor formatting for TS multi-line string)
const quantSystemPrompt = `You are an advanced QUANT STRATEGY ENGINE.
Your job is to convert ANY natural-language trading strategy into a structured,
machine-readable strategy definition that can be executed on historical OHLC data.

CRITICAL RULES:
- NEVER invent trade results, signals, candles, profitability, or outcomes.
- ONLY return a strategy definition, not performance.
- Your output MUST be pure JSON.

### STRATEGY FORMAT YOU MUST RETURN:
{
"strategy": "custom_ai_strategy",
"params": {
"entryConditions": [...],
"exitConditions": [...],
"indicators": [...],
"risk": {
"stopLoss": null,
"takeProfit": null,
"positionSize": null
}
}
}

### HOW YOU WORK:
1. Read user text (example: "Buy when RSI is under 30 & MACD crosses up").
2. Translate the logic into:
- indicators needed
- entry conditions
- exit conditions
3. Keep it general and compatible with my backtest engine.

### ALLOWED INDICATORS:
- EMA, SMA
- RSI
- MACD
- ATR
- Bollinger Bands
- Custom numeric thresholds (example: price > 20000)
If user asks for another indicator, still generate the JSON — I will add code support later.

### EXAMPLES YOU SHOULD FOLLOW:

USER: "Buy dip when RSI < 25 and price is under lower Bollinger Band. Sell when RSI > 60."
RETURN:
{
"strategy": "custom_ai_strategy",
"params": {
"indicators": [
{ "type": "RSI", "period": 14 },
{ "type": "BollingerBands", "period": 20, "stdDev": 2 }
],
"entryConditions": [
"RSI < 25",
"price < lowerBB"
],
"exitConditions": [
"RSI > 60"
]
}
}

USER: "50/200 EMA golden cross strategy"
RETURN:
{
"strategy": "custom_ai_strategy",
"params": {
"indicators": [
{ "type": "EMA", "period": 50 },
{ "type": "EMA", "period": 200 }
],
"entryConditions": ["EMA(50) crosses above EMA(200)"],
"exitConditions": ["EMA(50) crosses below EMA(200)"]
}
}

ONLY RETURN JSON. NOTHING ELSE.`;

interface QuantStrategyJson {
  strategy: string;
  params: {
    indicators: any[];
    entryConditions: string[];
    exitConditions: string[];
    risk?: {
      stopLoss?: any;
      takeProfit?: any;
      positionSize?: any;
    };
  };
}

function extractJson(raw: string): unknown | null {
  const cleaned = raw.trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch (_) {}
  const match = cleaned.match(/\{[\s\S]*\}$/);
  if (match) {
    try { return JSON.parse(match[0]); } catch (_) {}
  }
  return null;
}

function validateQuantJson(obj: unknown): { valid: boolean; error?: string } {
  const o = obj as QuantStrategyJson | null;
  if (!o || typeof o !== "object") return { valid: false, error: "Not an object" };
  if (o.strategy !== "custom_ai_strategy") return { valid: false, error: "strategy must be 'custom_ai_strategy'" };
  if (!o.params || typeof o.params !== "object") return { valid: false, error: "Missing params" };
  const { entryConditions, exitConditions, indicators, risk } = o.params;
  if (!Array.isArray(entryConditions)) return { valid: false, error: "entryConditions must be array" };
  if (!Array.isArray(exitConditions)) return { valid: false, error: "exitConditions must be array" };
  if (!Array.isArray(indicators)) return { valid: false, error: "indicators must be array" };
  // risk optional
  return { valid: true };
}
function mapPresetToStrategy(preset: string): { strategy: string; params?: any } {
  const presetMap: Record<string,{strategy:string;params?:any}> = {
    "EMA Cross": { strategy: "ema_crossover", params: { fastPeriod: 9, slowPeriod: 21 } },
    "SMA Cross": { strategy: "sma_crossover", params: { fastPeriod: 10, slowPeriod: 30 } },
    "RSI Mean Revert": { strategy: "rsi", params: { period: 14, oversold: 30, overbought: 70 } },
    "MACD": { strategy: "macd", params: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 } },
    "Breakout": { strategy: "mean_reversion", params: { period: 20, stdDev: 2 } },
  };
  return presetMap[preset] || { strategy: "ema_crossover" };
}

function convertQuantJsonToGeneric(quant: QuantStrategyJson): { strategy: string; params: any } | null {
  if (quant.strategy !== 'custom_ai_strategy') return null;
  const indicators: any[] = [];
  for (const ind of quant.params.indicators || []) {
    if (ind.type === 'EMA') indicators.push({ indicator: 'ema', period: ind.period });
    else if (ind.type === 'SMA') indicators.push({ indicator: 'sma', period: ind.period });
    else if (ind.type === 'RSI') indicators.push({ indicator: 'rsi', period: ind.period });
    else if (ind.type === 'MACD') indicators.push({ indicator: 'macd', fastPeriod: ind.fastPeriod||12, slowPeriod: ind.slowPeriod||26, signalPeriod: ind.signalPeriod||9 });
    else if (ind.type === 'price') indicators.push({ indicator: 'price' });
  }
  const parseRule = (s: string) => {
    s = s.trim();
    // crosses
    let m = s.match(/EMA\(?(\d+)\)?\s+crosses\s+above\s+EMA\(?(\d+)\)?/i);
    if (m) return { left:{indicator:'ema',period:parseInt(m[1])}, op:'crossesAbove', right:{indicator:'ema',period:parseInt(m[2])} };
    m = s.match(/EMA\(?(\d+)\)?\s+crosses\s+below\s+EMA\(?(\d+)\)?/i);
    if (m) return { left:{indicator:'ema',period:parseInt(m[1])}, op:'crossesBelow', right:{indicator:'ema',period:parseInt(m[2])} };
    m = s.match(/RSI\s*<\s*(\d+)/i);
    if (m) return { left:{indicator:'rsi',period:14}, op:'lessThan', right:{ value: parseFloat(m[1]) } };
    m = s.match(/RSI\s*>\s*(\d+)/i);
    if (m) return { left:{indicator:'rsi',period:14}, op:'greaterThan', right:{ value: parseFloat(m[1]) } };
    m = s.match(/price\s*<\s*(\d+)/i);
    if (m) return { left:{indicator:'price'}, op:'lessThan', right:{ value: parseFloat(m[1]) } };
    m = s.match(/price\s*>\s*(\d+)/i);
    if (m) return { left:{indicator:'price'}, op:'greaterThan', right:{ value: parseFloat(m[1]) } };
    return null;
  };
  const entryRules = (quant.params.entryConditions||[]).map(parseRule).filter(r=>r);
  const exitRules = (quant.params.exitConditions||[]).map(parseRule).filter(r=>r);
  if (entryRules.length === 0 && exitRules.length === 0) return null;
  return { strategy: 'generic_rules', params: { indicators, entryRules, exitRules } };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      asset = 'BTCUSDT',
      timeframe = '1h',
      start,
      end,
      preset = 'EMA Cross',
      prompt = ''
    } = body;

    if (!start || !end) return NextResponse.json({ error: 'start and end are required' }, { status: 400 });

    // 1. Attempt generic rules parse
    let strategyConfig: { strategy: string; params?: any } | null = null;
    let aiRaw = null;
    let aiQuantJson = null;
    let aiConverted = null;
    if (prompt) {
      const parsedGeneric = await parseNaturalLanguageStrategy(prompt);
      if (parsedGeneric) {
        strategyConfig = parsedGeneric;
      } else {
        // 2. Attempt quant system prompt
        const aiResp = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          temperature: 0.1,
          max_tokens: 700,
          messages: [
            { role: 'system', content: quantSystemPrompt },
            { role: 'user', content: prompt }
          ]
        });
        aiRaw = aiResp.choices[0]?.message?.content || '';
        aiQuantJson = extractJson(aiRaw);
        if (aiQuantJson && validateQuantJson(aiQuantJson).valid) {
          aiConverted = convertQuantJsonToGeneric(aiQuantJson as QuantStrategyJson);
          if (aiConverted) strategyConfig = aiConverted;
        }
      }
    }
    // 3. Fallback to preset mapping if still null
    if (!strategyConfig) strategyConfig = mapPresetToStrategy(preset);

    // 4. Fetch data
    let symbol = asset.toUpperCase().replace(/[^A-Z]/g, '');
    if (symbol === 'BTCUSD') symbol = 'BTCUSDT';
    if (!symbol.endsWith('USDT') && !symbol.endsWith('BUSD') && !symbol.endsWith('BTC')) symbol += 'USDT';

    const provider = getDataProvider('binance');
    let candles;
    try {
      candles = await provider.fetchCandles(symbol, timeframe, start, end);
    } catch (e:any) {
      return NextResponse.json({ error: e.message || 'Data fetch failed' }, { status: 500 });
    }
    if (!candles?.length) return NextResponse.json({ error: 'No candles fetched' }, { status: 404 });

    // 5. Init engine & execute
    const engine = new BacktestEngine({
      initialCapital: 10000,
      commission: 0.001,
      slippage: 0.0005,
      positionSizing: 'percent',
      positionSize: 100,
      maxPositions: 1,
    });
    const strategy = getStrategy(strategyConfig.strategy, strategyConfig.params);
    strategy.execute(candles, engine);
    const results = engine.getResults();

    // 6. Response (logga AI-data för felsökning)
    return NextResponse.json({
      success: true,
      symbol,
      timeframe,
      startDate: start,
      endDate: end,
      aiPromptUsed: !!prompt,
      parsedStrategy: strategyConfig,
      executedStrategy: strategy.name,
      dataPoints: candles.length,
      aiDebug: {
        aiRaw,
        aiQuantJson,
        aiConverted
      },
      results: {
        trades: results.trades.map(t => ({
          entryTime: new Date(t.entryTime).toISOString(),
          exitTime: new Date(t.exitTime).toISOString(),
          direction: t.direction,
          entryPrice: t.entryPrice,
          exitPrice: t.exitPrice,
          size: t.size,
          pnl: t.pnl,
          pnlPercent: t.pnlPercent,
          commission: t.commission
        })),
        equity: results.equity,
        timestamps: results.timestamps.map(ts => new Date(ts).toISOString()),
        statistics: {
          totalTrades: results.statistics.totalTrades,
          winningTrades: results.statistics.winningTrades,
          losingTrades: results.statistics.losingTrades,
          winRate: results.statistics.winRate,
          totalPnL: results.statistics.totalPnL,
          totalPnLPercent: results.statistics.totalPnLPercent,
          avgWin: results.statistics.avgWin,
          avgLoss: results.statistics.avgLoss,
          profitFactor: results.statistics.profitFactor,
          maxDrawdown: results.statistics.maxDrawdown,
          maxDrawdownPercent: results.statistics.maxDrawdownPercent,
          sharpeRatio: results.statistics.sharpeRatio,
          longTrades: results.statistics.longTrades,
          shortTrades: results.statistics.shortTrades,
          largestWin: results.statistics.largestWin,
          largestLoss: results.statistics.largestLoss,
          avgTradeDurationHours: results.statistics.avgTradeDuration / (1000*60*60),
          expectancy: results.statistics.expectancy
        }
      }
    });
  } catch (error: unknown) {
    console.error('[Backtest] Error', error);
    const message = (error instanceof Error) ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Backtest + Dynamic Strategy Parser',
    version: '3.0.0',
    flow: [
      'Try generic_rules parser',
      'Fallback quant system prompt -> convert',
      'Fallback preset map',
      'Execute and return performance'
    ],
    presets: ['EMA Cross','SMA Cross','RSI Mean Revert','MACD','Breakout'],
    exampleRequest: {
      asset: 'BTCUSDT', timeframe: '1h', start: '2025-01-01', end: '2025-02-01', prompt: '50/200 EMA golden cross with RSI filter below 55'
    }
  });
}