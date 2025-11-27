"use client";
import React, { useRef, useState } from "react";

function parseCSV(text: string) {
  const rows = text.trim().split(/\r?\n/);
  const headers = rows[0].split(",").map(h => h.trim().toLowerCase());
  const data = rows.slice(1).map(row => {
    const values = row.split(",");
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => obj[h] = values[i]?.trim() ?? "");
    return obj;
  });
  return data;
}

function computeStats(trades: any[]) {
  if (!trades.length) return null;
  const wins = trades.filter(t => Number(t.result) > 0);
  const losses = trades.filter(t => Number(t.result) <= 0);
  const winrate = (wins.length / trades.length) * 100;
  const avgRR = trades.reduce((sum, t) => sum + Number(t.rr || 0), 0) / trades.length;
  const expectancy = (winrate/100) * avgRR - ((1-winrate/100) * Math.abs(avgRR));
  return { winrate, avgRR, expectancy, count: trades.length };
}

export default function BacktestUploader() {
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const trades = parseCSV(text);
        const stats = computeStats(trades);
        setStats(stats);
        setError("");
      } catch (err) {
        setError("Fel vid tolkning av CSV");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="p-6 border rounded-xl max-w-lg mx-auto flex flex-col gap-4">
      <div className="font-semibold text-lg">Backtest CSV Uploader</div>
      <input type="file" accept=".csv" ref={fileInput} onChange={handleFile} className="mb-2" />
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {stats && (
        <div className="bg-muted p-4 rounded">
          <div>Antal trades: <b>{stats.count}</b></div>
          <div>Winrate: <b>{stats.winrate.toFixed(1)}%</b></div>
          <div>Genomsnittlig RR: <b>{stats.avgRR.toFixed(2)}</b></div>
          <div>Expectancy: <b>{stats.expectancy.toFixed(2)}</b></div>
        </div>
      )}
    </div>
  );
}
