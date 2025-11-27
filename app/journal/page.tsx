"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface Trade {
  id: string;
  date: string;
  asset: string;
  direction: "Long" | "Short";
  entry: number;
  stop: number;
  takeProfit: number;
  pnl: number;
  tags: string;
  imageUrl?: string;
  notes?: string;
}

interface Stats {
  totalPnL: number;
  roi: number;
  totalTrades: number;
  longCount: number;
  shortCount: number;
  winRate: number;
  avgPnL: number;
}

export default function JournalPage() {
  const searchParams = useSearchParams();
  const savedTrade = searchParams.get("saved");
  
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [sortColumn, setSortColumn] = useState<keyof Trade>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  // Date filter
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    asset: "",
    direction: "Long",
    entry: "",
    stop: "",
    takeProfit: "",
    pnl: "",
    tags: "",
    notes: "",
    imageUrl: ""
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Load trades from API
  useEffect(() => {
    async function loadTrades() {
      try {
        const res = await fetch("/api/journal/list");
        if (res.ok) {
          const data = await res.json();
          // Transform API data to our Trade interface
          const transformedTrades: Trade[] = data.map((item: any) => ({
            id: item.id,
            date: new Date(item.date || item.createdAt).toISOString().split('T')[0],
            asset: item.asset || "UNKNOWN",
            direction: item.direction === "long" ? "Long" : "Short",
            entry: item.entry || item.entryPrice || 0,
            stop: item.stopLoss || item.stop || 0,
            takeProfit: item.takeProfit || 0,
            pnl: item.result || item.pnl || 0,
            tags: item.tags?.join(", ") || item.tags || "",
            notes: item.notes || item.note || "",
            imageUrl: item.screenshot || item.screenshotUrl || undefined
          }));
          setTrades(transformedTrades);
        }
      } catch (err) {
        console.error("Failed to load trades:", err);
      } finally {
        setLoading(false);
      }
    }
    loadTrades();
  }, []);

  // Load saved trade from copilot
  useEffect(() => {
    if (savedTrade) {
      try {
        const trade = JSON.parse(decodeURIComponent(savedTrade));
        setTrades([trade, ...trades]);
      } catch (err) {
        console.error("Failed to load saved trade:", err);
      }
    }
  }, [savedTrade]);

  // Calculate stats
  const calculateStats = (): Stats => {
    let filteredTrades = trades;
    
    if (dateFrom) {
      filteredTrades = filteredTrades.filter(t => t.date >= dateFrom);
    }
    if (dateTo) {
      filteredTrades = filteredTrades.filter(t => t.date <= dateTo);
    }

    if (filteredTrades.length === 0) {
      return { totalPnL: 0, roi: 0, totalTrades: 0, longCount: 0, shortCount: 0, winRate: 0, avgPnL: 0 };
    }

    const totalPnL = filteredTrades.reduce((sum, t) => sum + t.pnl, 0);
    const longCount = filteredTrades.filter(t => t.direction === "Long").length;
    const shortCount = filteredTrades.filter(t => t.direction === "Short").length;
    const wins = filteredTrades.filter(t => t.pnl > 0).length;
    const winRate = (wins / filteredTrades.length) * 100;
    const avgPnL = totalPnL / filteredTrades.length;
    
    // Simple ROI calculation (assuming starting capital of 10000)
    const roi = (totalPnL / 100) * 10000 / 10000 * 100;

    return {
      totalPnL,
      roi,
      totalTrades: filteredTrades.length,
      longCount,
      shortCount,
      winRate,
      avgPnL
    };
  };

  const stats = calculateStats();

  // Handle sort
  const handleSort = (column: keyof Trade) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  // Sorted and filtered trades
  const getFilteredTrades = () => {
    let filtered = [...trades];
    
    if (dateFrom) {
      filtered = filtered.filter(t => t.date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(t => t.date <= dateTo);
    }

    return filtered.sort((a, b) => {
      let aVal: any = a[sortColumn];
      let bVal: any = b[sortColumn];

      switch (sortColumn) {
        case "date":
          aVal = Date.parse(a.date);
          bVal = Date.parse(b.date);
          break;
        case "direction":
          aVal = a.direction === "Long" ? 1 : 0;
          bVal = b.direction === "Long" ? 1 : 0;
          break;
        case "asset":
        case "tags":
          aVal = String(aVal).toLowerCase();
          bVal = String(bVal).toLowerCase();
          break;
        default:
          aVal = Number(aVal);
          bVal = Number(bVal);
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  const sortedTrades = getFilteredTrades();

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newTrade = {
        asset: formData.asset,
        direction: formData.direction.toLowerCase(),
        entryPrice: parseFloat(formData.entry),
        stopLoss: parseFloat(formData.stop),
        takeProfit: parseFloat(formData.takeProfit),
        result: parseFloat(formData.pnl),
        tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
        notes: formData.notes,
        screenshotUrl: formData.imageUrl || undefined,
        date: new Date().toISOString()
      };

      const res = await fetch("/api/journal/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTrade)
      });

      if (res.ok) {
        const savedTrade = await res.json();
        
        // Add to local state
        const tradeForState: Trade = {
          id: savedTrade.id,
          date: new Date(savedTrade.createdAt).toISOString().split('T')[0],
          asset: savedTrade.asset,
          direction: savedTrade.direction === "long" ? "Long" : "Short",
          entry: savedTrade.entryPrice,
          stop: savedTrade.stopLoss,
          takeProfit: savedTrade.takeProfit,
          pnl: savedTrade.result,
          tags: savedTrade.tags?.join(", ") || "",
          notes: savedTrade.notes || "",
          imageUrl: savedTrade.screenshotUrl
        };
        
        setTrades([tradeForState, ...trades]);
        
        // Reset form
        setFormData({
          asset: "",
          direction: "Long",
          entry: "",
          stop: "",
          takeProfit: "",
          pnl: "",
          tags: "",
          notes: "",
          imageUrl: ""
        });
        setImagePreview(null);
      }
    } catch (err) {
      console.error("Failed to save trade:", err);
      alert("Failed to save trade. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-bloomberg-bg py-8">
      <div className="max-w-[1600px] mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-bloomberg-headline mb-2">Trading Journal</h1>
          <p className="text-sm text-bloomberg-text">Track and analyze your trading performance</p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-bloomberg-blue border-r-transparent"></div>
            <p className="mt-4 text-bloomberg-text">Loading trades...</p>
          </div>
        ) : (
          <>
            {/* Stats Block */}
            <div className="mb-8">
          {/* Date Filter */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-bloomberg-text uppercase tracking-wide">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-1.5 border border-black/10 rounded text-xs text-bloomberg-headline focus:border-bloomberg-blue focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-bloomberg-text uppercase tracking-wide">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-1.5 border border-black/10 rounded text-xs text-bloomberg-headline focus:border-bloomberg-blue focus:outline-none"
              />
            </div>
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(""); setDateTo(""); }}
                className="text-xs text-bloomberg-blue hover:text-bloomberg-headline transition"
              >
                Clear Filter
              </button>
            )}
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {/* Total PnL */}
            <div className="bg-white rounded-lg border border-black/10 p-4">
              <div className="text-[10px] text-bloomberg-text uppercase tracking-wider mb-1">Total PnL</div>
              <div className={`text-2xl font-semibold ${stats.totalPnL >= 0 ? "text-bloomberg-green" : "text-bloomberg-negative"}`}>
                {stats.totalPnL >= 0 ? "+" : ""}{stats.totalPnL.toFixed(2)}%
              </div>
            </div>

            {/* ROI */}
            <div className="bg-white rounded-lg border border-black/10 p-4">
              <div className="text-[10px] text-bloomberg-text uppercase tracking-wider mb-1">ROI</div>
              <div className={`text-2xl font-semibold ${stats.roi >= 0 ? "text-bloomberg-green" : "text-bloomberg-negative"}`}>
                {stats.roi >= 0 ? "+" : ""}{stats.roi.toFixed(2)}%
              </div>
            </div>

            {/* Total Trades */}
            <div className="bg-white rounded-lg border border-black/10 p-4">
              <div className="text-[10px] text-bloomberg-text uppercase tracking-wider mb-1">Trades</div>
              <div className="text-2xl font-semibold text-bloomberg-headline">{stats.totalTrades}</div>
            </div>

            {/* Long Count */}
            <div className="bg-white rounded-lg border border-black/10 p-4">
              <div className="text-[10px] text-bloomberg-text uppercase tracking-wider mb-1">Long</div>
              <div className="text-2xl font-semibold text-bloomberg-green">{stats.longCount}</div>
            </div>

            {/* Short Count */}
            <div className="bg-white rounded-lg border border-black/10 p-4">
              <div className="text-[10px] text-bloomberg-text uppercase tracking-wider mb-1">Short</div>
              <div className="text-2xl font-semibold text-bloomberg-negative">{stats.shortCount}</div>
            </div>

            {/* Win Rate */}
            <div className="bg-white rounded-lg border border-black/10 p-4">
              <div className="text-[10px] text-bloomberg-text uppercase tracking-wider mb-1">Win Rate</div>
              <div className="text-2xl font-semibold text-bloomberg-headline">{stats.winRate.toFixed(1)}%</div>
            </div>

            {/* Avg PnL */}
            <div className="bg-white rounded-lg border border-black/10 p-4">
              <div className="text-[10px] text-bloomberg-text uppercase tracking-wider mb-1">Avg PnL</div>
              <div className={`text-2xl font-semibold ${stats.avgPnL >= 0 ? "text-bloomberg-green" : "text-bloomberg-negative"}`}>
                {stats.avgPnL >= 0 ? "+" : ""}{stats.avgPnL.toFixed(2)}%
              </div>
            </div>

            {/* Longest Streak (placeholder) */}
            <div className="bg-white rounded-lg border border-black/10 p-4">
              <div className="text-[10px] text-bloomberg-text uppercase tracking-wider mb-1">Best Streak</div>
              <div className="text-2xl font-semibold text-bloomberg-headline">3</div>
            </div>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          {/* LEFT: Trades Table */}
          <div className="bg-white rounded-lg border border-black/10 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bloomberg-bg border-b border-black/10">
                  <tr>
                    <th 
                      className="px-6 py-4 text-left text-xs font-semibold text-bloomberg-headline uppercase tracking-wider cursor-pointer hover:bg-black/5 transition"
                      onClick={() => handleSort("date")}
                    >
                      <div className="flex items-center gap-2">
                        Date
                        <span className="text-[10px]">{sortColumn === "date" ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}</span>
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-semibold text-bloomberg-headline uppercase tracking-wider cursor-pointer hover:bg-black/5 transition"
                      onClick={() => handleSort("asset")}
                    >
                      <div className="flex items-center gap-2">
                        Asset
                        <span className="text-[10px]">{sortColumn === "asset" ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}</span>
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-semibold text-bloomberg-headline uppercase tracking-wider cursor-pointer hover:bg-black/5 transition"
                      onClick={() => handleSort("direction")}
                    >
                      <div className="flex items-center gap-2">
                        Direction
                        <span className="text-[10px]">{sortColumn === "direction" ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}</span>
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-semibold text-bloomberg-headline uppercase tracking-wider cursor-pointer hover:bg-black/5 transition"
                      onClick={() => handleSort("pnl")}
                    >
                      <div className="flex items-center gap-2">
                        PnL %
                        <span className="text-[10px]">{sortColumn === "pnl" ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-bloomberg-headline uppercase tracking-wider">
                      Tags
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {sortedTrades.map((trade) => (
                    <tr
                      key={trade.id}
                      className="hover:bg-bloomberg-bg transition cursor-pointer"
                      onClick={() => setSelectedTrade(trade)}
                    >
                      <td className="px-6 py-4 text-sm text-bloomberg-text">{trade.date}</td>
                      <td className="px-6 py-4 text-sm font-medium text-bloomberg-headline">{trade.asset}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-3 py-1.5 rounded-md ${
                          trade.direction === "Long" 
                            ? "bg-bloomberg-green/10 text-bloomberg-green" 
                            : "bg-bloomberg-negative/10 text-bloomberg-negative"
                        }`}>
                          {trade.direction}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-sm font-semibold ${
                        trade.pnl >= 0 ? "text-bloomberg-green" : "text-bloomberg-negative"
                      }`}>
                        {trade.pnl >= 0 ? "+" : ""}{trade.pnl}%
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {trade.tags.split(",").map((tag, i) => (
                            <span key={i} className="text-[10px] font-medium px-2.5 py-1 bg-black/5 text-bloomberg-text rounded-md uppercase tracking-wide">
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT: Add Trade Form */}
          <div className="bg-white rounded-lg border border-black/10 shadow-sm p-6 h-fit lg:sticky lg:top-8">
            <h2 className="text-lg font-semibold text-bloomberg-headline mb-6">Add Trade</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Asset */}
              <div>
                <label className="block text-xs font-medium text-bloomberg-text mb-1.5 uppercase tracking-wide">Asset</label>
                <input
                  type="text"
                  value={formData.asset}
                  onChange={(e) => setFormData({ ...formData, asset: e.target.value })}
                  placeholder="BTCUSD"
                  className="w-full px-4 py-2.5 border border-black/10 rounded-md text-sm text-bloomberg-headline focus:border-bloomberg-blue focus:outline-none transition"
                  required
                />
              </div>

              {/* Direction */}
              <div>
                <label className="block text-xs font-medium text-bloomberg-text mb-1.5 uppercase tracking-wide">Direction</label>
                <select
                  value={formData.direction}
                  onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                  className="w-full px-4 py-2.5 border border-black/10 rounded-md text-sm text-bloomberg-headline focus:border-bloomberg-blue focus:outline-none transition"
                >
                  <option value="Long">Long</option>
                  <option value="Short">Short</option>
                </select>
              </div>

              {/* Entry, Stop, TP in row */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-bloomberg-text mb-1.5 uppercase tracking-wide">Entry</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.entry}
                    onChange={(e) => setFormData({ ...formData, entry: e.target.value })}
                    placeholder="86000"
                    className="w-full px-3 py-2.5 border border-black/10 rounded-md text-sm text-bloomberg-headline focus:border-bloomberg-blue focus:outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-bloomberg-text mb-1.5 uppercase tracking-wide">Stop</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.stop}
                    onChange={(e) => setFormData({ ...formData, stop: e.target.value })}
                    placeholder="85000"
                    className="w-full px-3 py-2.5 border border-black/10 rounded-md text-sm text-bloomberg-headline focus:border-bloomberg-blue focus:outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-bloomberg-text mb-1.5 uppercase tracking-wide">TP</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.takeProfit}
                    onChange={(e) => setFormData({ ...formData, takeProfit: e.target.value })}
                    placeholder="88000"
                    className="w-full px-3 py-2.5 border border-black/10 rounded-md text-sm text-bloomberg-headline focus:border-bloomberg-blue focus:outline-none transition"
                    required
                  />
                </div>
              </div>

              {/* PnL */}
              <div>
                <label className="block text-xs font-medium text-bloomberg-text mb-1.5 uppercase tracking-wide">PnL %</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pnl}
                  onChange={(e) => setFormData({ ...formData, pnl: e.target.value })}
                  placeholder="2.5"
                  className="w-full px-4 py-2.5 border border-black/10 rounded-md text-sm text-bloomberg-headline focus:border-bloomberg-blue focus:outline-none transition"
                  required
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-medium text-bloomberg-text mb-1.5 uppercase tracking-wide">Tags</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="breakout, momentum"
                  className="w-full px-4 py-2.5 border border-black/10 rounded-md text-sm text-bloomberg-headline focus:border-bloomberg-blue focus:outline-none transition"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-bloomberg-text mb-1.5 uppercase tracking-wide">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Trade notes..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-black/10 rounded-md text-sm text-bloomberg-headline focus:border-bloomberg-blue focus:outline-none transition resize-none"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-medium text-bloomberg-text mb-1.5 uppercase tracking-wide">Screenshot</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-4 py-2.5 border border-black/10 rounded-md text-sm text-bloomberg-text focus:border-bloomberg-blue focus:outline-none transition file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-black file:text-white hover:file:bg-bloomberg-btn-hover file:cursor-pointer"
                />
                {imagePreview && (
                  <div className="mt-3">
                    <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-md border border-black/10" />
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-black text-white py-3 rounded-md font-medium text-sm uppercase tracking-wider hover:bg-bloomberg-btn-hover transition"
              >
                Save Trade
              </button>
            </form>
          </div>
        </div>

      {/* Trade Detail Modal */}
      {selectedTrade && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedTrade(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-bloomberg-yellow px-6 py-4 border-b border-black/10 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-bloomberg-headline">Trade Details</h2>
              <button
                onClick={() => setSelectedTrade(null)}
                className="text-2xl text-bloomberg-headline hover:text-bloomberg-text transition"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Overview Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-bloomberg-text uppercase tracking-wide mb-1">Date</div>
                  <div className="text-sm font-medium text-bloomberg-headline">{selectedTrade.date}</div>
                </div>
                <div>
                  <div className="text-xs text-bloomberg-text uppercase tracking-wide mb-1">Asset</div>
                  <div className="text-sm font-medium text-bloomberg-headline">{selectedTrade.asset}</div>
                </div>
                <div>
                  <div className="text-xs text-bloomberg-text uppercase tracking-wide mb-1">Direction</div>
                  <span className={`inline-block text-xs font-semibold px-3 py-1.5 rounded-md ${
                    selectedTrade.direction === "Long" 
                      ? "bg-bloomberg-green/10 text-bloomberg-green" 
                      : "bg-bloomberg-negative/10 text-bloomberg-negative"
                  }`}>
                    {selectedTrade.direction}
                  </span>
                </div>
                <div>
                  <div className="text-xs text-bloomberg-text uppercase tracking-wide mb-1">PnL</div>
                  <div className={`text-sm font-semibold ${
                    selectedTrade.pnl >= 0 ? "text-bloomberg-green" : "text-bloomberg-negative"
                  }`}>
                    {selectedTrade.pnl >= 0 ? "+" : ""}{selectedTrade.pnl}%
                  </div>
                </div>
              </div>

              {/* Price Levels */}
              <div className="bg-bloomberg-bg rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-bloomberg-text uppercase tracking-wide mb-1">Entry</div>
                    <div className="text-sm font-medium text-bloomberg-headline">{selectedTrade.entry}</div>
                  </div>
                  <div>
                    <div className="text-xs text-bloomberg-text uppercase tracking-wide mb-1">Stop Loss</div>
                    <div className="text-sm font-medium text-bloomberg-negative">{selectedTrade.stop}</div>
                  </div>
                  <div>
                    <div className="text-xs text-bloomberg-text uppercase tracking-wide mb-1">Take Profit</div>
                    <div className="text-sm font-medium text-bloomberg-green">{selectedTrade.takeProfit}</div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {selectedTrade.tags && (
                <div>
                  <div className="text-xs text-bloomberg-text uppercase tracking-wide mb-2">Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTrade.tags.split(",").map((tag, i) => (
                      <span key={i} className="text-xs font-medium px-3 py-1.5 bg-black/5 text-bloomberg-text rounded-md uppercase tracking-wide">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedTrade.notes && (
                <div>
                  <div className="text-xs text-bloomberg-text uppercase tracking-wide mb-2">Notes</div>
                  <p className="text-sm text-bloomberg-text leading-relaxed bg-bloomberg-bg rounded-lg p-4">
                    {selectedTrade.notes}
                  </p>
                </div>
              )}

              {/* Image */}
              {selectedTrade.imageUrl && (
                <div>
                  <div className="text-xs text-bloomberg-text uppercase tracking-wide mb-2">Screenshot</div>
                  <img 
                    src={selectedTrade.imageUrl} 
                    alt="Trade screenshot" 
                    className="w-full rounded-lg border border-black/10"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </>
    )}
    </div>
  </div>
  );
}
