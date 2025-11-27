"use client";

import React, { useState } from "react";
import BacktestUploader from "@/components/backtest/BacktestUploader";

/*
  Backtest Engine UI with full backend integration
  ------------------------------------------------
  - Calls /api/backtest for AI-powered strategy generation
  - Displays real backtest results with trades and statistics
  - Bloomberg-inspired premium styling
*/

const timeframes = ["1m", "5m", "15m", "1h", "4h", "1d"];


interface Trade {
  date: string;
  asset: string;
  side: "long" | "short";
  entry: number;
  exit: number;
  pnl: number;
}

interface BacktestResults {
  trades: Trade[];
  statistics: {
    totalROI: number;
    winRate: number;
    maxDrawdown: number;
    totalTrades: number;
    profitFactor: number;
  };
  equity: number[];
  timestamps: string[];
}

export default function BacktestPage() {
  // Set default dates: last 3 months
  const getDefaultDates = () => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 3);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  };
  
  const defaultDates = getDefaultDates();
  
  const [asset, setAsset] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("1h");
  const [dateStart, setDateStart] = useState(defaultDates.start);
  const [dateEnd, setDateEnd] = useState(defaultDates.end);
  // Ingen preset, endast custom prompt
  const [prompt, setPrompt] = useState("");
  const [hasRun, setHasRun] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<BacktestResults | null>(null);

  async function handleRun() {
    setIsLoading(true);
    setError(null);
    setHasRun(false);
    
    try {
      // Prepare request payload
      const payload = {
        asset,
        timeframe,
        start: dateStart,
        end: dateEnd,
        prompt,
      };

      console.log("Running backtest with:", payload);

      // Call backend API
      const response = await fetch("/api/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Backtest failed");
      }

      const data = await response.json();
      console.log("Backtest results:", data);
      console.log("Equity array:", data.results.equity);
      console.log("Timestamps array:", data.results.timestamps);
      console.log("Statistics:", data.results.statistics);

      // Transform API response to match our interface
      const transformedResults: BacktestResults = {
        trades: data.results.trades.map((t: any) => ({
          date: new Date(t.entryTime).toLocaleDateString(),
          asset: data.symbol,
          side: t.direction,
          entry: t.entryPrice,
          exit: t.exitPrice,
          pnl: t.pnl,
        })),
        statistics: {
          totalROI: data.results.statistics.totalPnLPercent,
          winRate: data.results.statistics.winRate,
          maxDrawdown: data.results.statistics.maxDrawdownPercent,
          totalTrades: data.results.statistics.totalTrades,
          profitFactor: data.results.statistics.profitFactor,
        },
        equity: data.results.equity || [],
        timestamps: data.results.timestamps || [],
      };

      setResults(transformedResults);
      setHasRun(true);
      
      // Show warning if no trades
      if (transformedResults.trades.length === 0) {
        setError("No trades generated. Try: 1) Longer date range, 2) Different strategy, or 3) More volatile asset.");
      }
    } catch (err: any) {
      console.error("Backtest error:", err);
      setError(err.message || "Failed to run backtest");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bloomberg-bg text-bloomberg-black">
      <div className="max-w-[1200px] mx-auto px-8 py-12">
        {/* SECTION 1: HERO + INPUT PANEL */}
        <section className="mb-20">
        {/* HERO */}
        <div className="text-center mb-12">
          <div className="inline-block px-5 py-2 mb-5 rounded-md bg-white/90 border border-black/10 shadow-sm">
            <span className="text-[11px] uppercase tracking-[0.25em] text-bloomberg-secondary font-medium">Backtesting</span>
          </div>
          <h1 className="text-[42px] leading-[1.1] font-semibold tracking-tight text-bloomberg-headline mb-4">Backtest Engine</h1>
          <p className="max-w-2xl mx-auto text-bloomberg-text text-[15px] leading-relaxed font-light">
            Run strategy simulations on any asset with institutional-grade clarity.
          </p>
        </div>

        {/* INPUT PANEL */}
        <div className="bg-white/95 backdrop-blur-sm border border-black/10 rounded-xl shadow-xl p-8 mb-14">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Asset */}
            <div className="space-y-3">
              <label className="text-[11px] uppercase tracking-[0.2em] font-medium text-[#111] opacity-70">Asset</label>
              <input
                type="text"
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
                placeholder="e.g. BTCUSDT, ETHUSDT, SOLUSDT"
                className="w-full px-4 py-3 bg-white border border-black/10 rounded-lg text-sm font-light focus:border-bloomberg-blue focus:outline-none transition"
              />
              <p className="text-xs text-bloomberg-secondary">Binance symbols (BTCUSDT, ETHUSDT, SOLUSDT, etc.)</p>
            </div>
            {/* Timeframe */}
            <div className="space-y-3">
              <label className="text-[11px] uppercase tracking-[0.2em] font-medium text-[#111] opacity-70">Timeframe</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-black/10 rounded-lg text-sm font-light focus:border-bloomberg-blue focus:outline-none transition"
              >
                {timeframes.map(tf => <option key={tf}>{tf}</option>)}
              </select>
            </div>
            {/* Date Start */}
            <div className="space-y-3">
              <label className="text-[11px] uppercase tracking-[0.2em] font-medium text-[#111] opacity-70">Start Date</label>
              <input
                type="date"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-black/10 rounded-lg text-sm font-light focus:border-bloomberg-blue focus:outline-none transition"
              />
            </div>
            {/* Date End */}
            <div className="space-y-3">
              <label className="text-[11px] uppercase tracking-[0.2em] font-medium text-[#111] opacity-70">End Date</label>
              <input
                type="date"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-black/10 rounded-lg text-sm font-light focus:border-bloomberg-blue focus:outline-none transition"
              />
            </div>
            {/* Strategy Preset borttagen, endast custom prompt */}
            {/* Strategy Prompt */}
            <div className="space-y-3 md:col-span-1 md:row-span-2">
              <label className="text-[11px] uppercase tracking-[0.2em] font-medium text-[#111] opacity-70">Strategy Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your strategy: e.g. 'Go long when 20 EMA crosses above 50 EMA and RSI < 60'"
                rows={7}
                className="w-full px-4 py-3 bg-white border border-black/10 rounded-lg text-sm font-light placeholder-[#111]/40 focus:border-bloomberg-blue focus:outline-none transition resize-none"
              />
            </div>
          </div>
          
          {/* Run Button */}
          <div className="mt-10 flex justify-center">
            <button
              onClick={handleRun}
              disabled={isLoading || !dateStart || !dateEnd}
              className="px-10 py-4 bg-[#000] text-white border border-black/30 rounded-lg text-[12px] uppercase tracking-[0.25em] font-medium hover:bg-[#1A1A1A] transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Running..." : "Run Backtest"}
            </button>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium mb-2">Error:</p>
              <p className="text-sm text-red-600">{error}</p>
              <p className="text-xs text-red-500 mt-3">💡 Open browser Console (F12) to see detailed logs</p>
            </div>
          )}
        </div>
        </section>

        {/* SECTION 2: RESULTS */}
        <section className="rounded-2xl bg-[#0D0D0D] border border-black/40 px-8 py-12 shadow-inner mb-10">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-[#121212] border border-white/5 rounded-xl p-6 shadow-lg">
              <div className="text-[11px] uppercase tracking-[0.25em] text-bloomberg-secondary font-medium mb-3">Total ROI</div>
              <div className={`text-[34px] font-semibold tracking-tight ${
                hasRun && results 
                  ? results.statistics.totalROI >= 0 
                    ? "text-bloomberg-green" 
                    : "text-bloomberg-negative"
                  : "text-bloomberg-headline"
              }`}>
                {hasRun && results ? `${results.statistics.totalROI.toFixed(2)}%` : "—"}
              </div>
            </div>
            <div className="bg-[#121212] border border-white/5 rounded-xl p-6 shadow-lg">
              <div className="text-[11px] uppercase tracking-[0.25em] text-bloomberg-secondary font-medium mb-3">Win Rate</div>
              <div className="text-[34px] font-semibold text-bloomberg-headline tracking-tight">
                {hasRun && results ? `${results.statistics.winRate.toFixed(1)}%` : "—"}
              </div>
            </div>
            <div className="bg-[#121212] border border-white/5 rounded-xl p-6 shadow-lg">
              <div className="text-[11px] uppercase tracking-[0.25em] text-bloomberg-secondary font-medium mb-3">Max Drawdown</div>
              <div className="text-[34px] font-semibold text-bloomberg-negative tracking-tight">
                {hasRun && results ? `${results.statistics.maxDrawdown.toFixed(2)}%` : "—"}
              </div>
            </div>
          </div>

          {/* Equity Curve Placeholder */}
          <div className="mb-12">
            <div className="bg-[#121212] border border-white/5 rounded-xl p-8 h-80 flex items-center justify-center shadow-lg">
              {hasRun && results && results.equity.length > 0 ? (
                <div className="w-full h-full relative">
                  <div className="text-[13px] uppercase tracking-[0.25em] text-bloomberg-secondary mb-4 font-medium">Equity Curve</div>
                  <svg width="100%" height="90%" viewBox="0 0 800 300" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="equityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#00D084" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#00D084" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>
                    {(() => {
                      const equity = results.equity || [];
                      
                      // Validate equity data
                      if (equity.length === 0 || equity.some(v => isNaN(v) || !isFinite(v))) {
                        return (
                          <text x="400" y="150" textAnchor="middle" fill="#666" fontSize="14">
                            No valid equity data
                          </text>
                        );
                      }
                      
                      const minEquity = Math.min(...equity);
                      const maxEquity = Math.max(...equity);
                      const range = maxEquity - minEquity || 1; // Prevent division by zero
                      const padding = range * 0.1;
                      
                      const points = equity.map((value, index) => {
                        const x = (index / Math.max(equity.length - 1, 1)) * 800;
                        const y = 300 - ((value - minEquity + padding) / (range + 2 * padding)) * 300;
                        return `${x},${y}`;
                      }).join(' ');
                      
                      const areaPoints = `0,300 ${points} 800,300`;
                      
                      return (
                        <>
                          <polyline
                            points={areaPoints}
                            fill="url(#equityGradient)"
                            stroke="none"
                          />
                          <polyline
                            points={points}
                            fill="none"
                            stroke="#00D084"
                            strokeWidth="2"
                          />
                        </>
                      );
                    })()}
                  </svg>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-[13px] uppercase tracking-[0.25em] text-bloomberg-secondary mb-3 font-medium">Equity Curve</div>
                  <p className="text-sm text-bloomberg-text font-light">
                    {isLoading ? "Generating equity curve..." : "Equity Curve will appear here"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Trades Table */}
          <div className="bg-[#121212] border border-white/5 rounded-xl shadow-lg mb-12">
            <div className="px-8 pt-8">
              <div className="flex items-center justify-between mb-5">
                <div className="text-[11px] uppercase tracking-[0.25em] text-bloomberg-secondary font-medium">Trades</div>
                {hasRun && results && (
                  <div className="text-[11px] text-bloomberg-text">
                    <span className="font-medium">{results.statistics.totalTrades}</span> trades • 
                    <span className="ml-2 font-medium">PF: {results.statistics.profitFactor.toFixed(2)}</span>
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-[0.15em] text-bloomberg-secondary border-b border-white/10">
                      <th className="py-3 pr-6 font-medium">Date</th>
                      <th className="py-3 pr-6 font-medium">Asset</th>
                      <th className="py-3 pr-6 font-medium">Side</th>
                      <th className="py-3 pr-6 font-medium">Entry</th>
                      <th className="py-3 pr-6 font-medium">Exit</th>
                      <th className="py-3 pr-6 font-medium">PnL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hasRun && results && results.trades.length > 0 ? (
                      results.trades.map((trade, idx) => (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition">
                          <td className="py-4 pr-6 text-bloomberg-text font-light">{trade.date}</td>
                          <td className="py-4 pr-6 text-bloomberg-headline font-medium">{trade.asset}</td>
                          <td className="py-4 pr-6">
                            <span className={`px-2 py-1 rounded text-[10px] uppercase tracking-wider font-medium ${
                              trade.side === "long" 
                                ? "bg-bloomberg-green/20 text-bloomberg-green" 
                                : "bg-bloomberg-negative/20 text-bloomberg-negative"
                            }`}>
                              {trade.side}
                            </span>
                          </td>
                          <td className="py-4 pr-6 text-bloomberg-text font-light">{trade.entry.toFixed(2)}</td>
                          <td className="py-4 pr-6 text-bloomberg-text font-light">{trade.exit.toFixed(2)}</td>
                          <td className={`py-4 pr-6 font-medium ${
                            trade.pnl >= 0 ? "text-bloomberg-green" : "text-bloomberg-negative"
                          }`}>
                            {trade.pnl >= 0 ? "+" : ""}{trade.pnl.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-bloomberg-secondary font-light">
                          {isLoading 
                            ? "Running backtest..." 
                            : "Trades will appear here after running a backtest."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* CSV Upload at bottom */}
          <div className="bg-[#121212] border border-white/5 rounded-xl p-8 shadow-lg">
            <div className="text-[11px] uppercase tracking-[0.25em] text-bloomberg-secondary font-medium mb-6">Import Trades (CSV)</div>
            <BacktestUploader />
          </div>
        </section>
      </div>
    </div>
  );
}
