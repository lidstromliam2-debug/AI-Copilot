/**
 * Backtest Engine
 * Executes trading strategies and calculates performance metrics
 */

import { Candle } from "./dataProviders";

export interface Trade {
  entryTime: number;
  exitTime: number;
  direction: "long" | "short";
  entryPrice: number;
  exitPrice: number;
  size: number;
  pnl: number;
  pnlPercent: number;
  commission: number;
}

export interface Position {
  direction: "long" | "short";
  entryPrice: number;
  entryTime: number;
  size: number;
}

export interface BacktestResult {
  trades: Trade[];
  equity: number[];
  timestamps: number[];
  statistics: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalPnL: number;
    totalPnLPercent: number;
    avgWin: number;
    avgLoss: number;
    profitFactor: number;
    maxDrawdown: number;
    maxDrawdownPercent: number;
    sharpeRatio: number;
    longTrades: number;
    shortTrades: number;
    largestWin: number;
    largestLoss: number;
    avgTradeDuration: number;
    expectancy: number;
  };
}

export interface BacktestConfig {
  initialCapital: number;
  commission: number; // as decimal, e.g., 0.001 = 0.1%
  slippage: number; // as decimal
  positionSizing: "fixed" | "percent" | "risk";
  positionSize: number; // meaning depends on positionSizing
  maxPositions: number;
}

export class BacktestEngine {
  private config: BacktestConfig;
  private capital: number;
  private equity: number[];
  private timestamps: number[];
  private trades: Trade[];
  private position: Position | null = null;

  constructor(config: Partial<BacktestConfig> = {}) {
    this.config = {
      initialCapital: config.initialCapital || 10000,
      commission: config.commission || 0.001,
      slippage: config.slippage || 0.0005,
      positionSizing: config.positionSizing || "percent",
      positionSize: config.positionSize || 95, // 95% of capital (leaves room for commission + rounding)
      maxPositions: config.maxPositions || 1,
    };

    this.capital = this.config.initialCapital;
    this.equity = [this.capital];
    this.timestamps = [];
    this.trades = [];
  }

  /**
   * Calculate position size based on configuration
   */
  private calculatePositionSize(price: number): number {
    switch (this.config.positionSizing) {
      case "fixed":
        return this.config.positionSize;

      case "percent":
        const percentOfCapital = this.config.positionSize / 100;
        return (this.capital * percentOfCapital) / price;

      case "risk":
        // Risk-based sizing would need stop-loss distance
        // For now, default to percent
        return (this.capital * (this.config.positionSize / 100)) / price;

      default:
        return this.capital / price;
    }
  }

  /**
   * Apply slippage to price
   */
  private applySlippage(price: number, direction: "long" | "short"): number {
    if (direction === "long") {
      return price * (1 + this.config.slippage);
    } else {
      return price * (1 - this.config.slippage);
    }
  }

  /**
   * Calculate commission
   */
  private calculateCommission(price: number, size: number): number {
    return price * size * this.config.commission;
  }

  /**
   * Open a long position
   */
  public openLong(price: number, time: number): boolean {
    if (this.position) return false;

    const adjustedPrice = this.applySlippage(price, "long");
    
    // Calculate max size we can afford including commission
    // Total cost = (price * size) + (price * size * commission)
    // Total cost = price * size * (1 + commission)
    // size = capital / (price * (1 + commission))
    const maxAffordable = this.capital / (adjustedPrice * (1 + this.config.commission));
    
    // Apply position sizing
    let targetSize = this.calculatePositionSize(adjustedPrice);
    const size = Math.min(targetSize, maxAffordable);
    
    const cost = adjustedPrice * size;
    const commission = this.calculateCommission(adjustedPrice, size);

    if (this.capital < cost + commission || size <= 0) {
      console.log(`[BacktestEngine] Failed to open long: capital=${this.capital}, cost=${cost}, commission=${commission}`);
      return false; // Not enough capital
    }

    this.position = {
      direction: "long",
      entryPrice: adjustedPrice,
      entryTime: time,
      size,
    };

    // Deduct position cost and commission from capital
    const positionCost = adjustedPrice * size;
    this.capital -= (positionCost + commission);
    console.log(`[BacktestEngine] Opened long: size=${size.toFixed(6)}, price=${adjustedPrice}, cost=${positionCost.toFixed(2)}, commission=${commission.toFixed(2)}, remaining capital=${this.capital.toFixed(2)}`);
    return true;
  }

  /**
   * Open a short position
   */
  public openShort(price: number, time: number): boolean {
    if (this.position) return false;

    const adjustedPrice = this.applySlippage(price, "short");
    const size = this.calculatePositionSize(adjustedPrice);
    const commission = this.calculateCommission(adjustedPrice, size);

    if (this.capital < commission) {
      return false;
    }

    this.position = {
      direction: "short",
      entryPrice: adjustedPrice,
      entryTime: time,
      size,
    };

    this.capital -= commission;
    return true;
  }

  /**
   * Close current position
   */
  public closePosition(price: number, time: number): boolean {
    if (!this.position) return false;

    const pos = this.position;
    const adjustedPrice = this.applySlippage(
      price,
      pos.direction === "long" ? "short" : "long"
    );
    const commission = this.calculateCommission(adjustedPrice, pos.size);

    let pnl = 0;
    if (pos.direction === "long") {
      pnl = (adjustedPrice - pos.entryPrice) * pos.size;
    } else {
      pnl = (pos.entryPrice - adjustedPrice) * pos.size;
    }

    pnl -= commission;

    const positionValue = pos.entryPrice * pos.size;
    const pnlPercent = (pnl / positionValue) * 100;

    // Return exit value to capital and deduct commission
    const exitValue = adjustedPrice * pos.size;
    this.capital += exitValue;
    this.capital -= commission;

    console.log(`[BacktestEngine] Closed position: exitPrice=${adjustedPrice}, exitValue=${exitValue.toFixed(2)}, commission=${commission.toFixed(2)}, pnl=${pnl.toFixed(2)}, capital=${this.capital.toFixed(2)}`);

    const trade: Trade = {
      entryTime: pos.entryTime,
      exitTime: time,
      direction: pos.direction,
      entryPrice: pos.entryPrice,
      exitPrice: adjustedPrice,
      size: pos.size,
      pnl,
      pnlPercent,
      commission: commission * 2, // Entry + exit
    };

    this.trades.push(trade);
    this.position = null;

    return true;
  }


  /**
   * Update equity curve
   * (now with candle validation)
   */
  public updateEquity(price: number, time: number): void {
    if (typeof price !== 'number' || isNaN(price)) {
      console.warn('[BacktestEngine] Skipping equity update: invalid price', price, 'at time', time);
      return;
    }
    let currentEquity = this.capital;
    if (this.position) {
      const positionValue = price * this.position.size;
      currentEquity += positionValue;
    }
    this.equity.push(currentEquity);
    this.timestamps.push(time);
  }

  /**
   * Safe candle accessor (skip undefined or broken candles)
   */
  public static isValidCandle(candle: any): boolean {
    return candle && typeof candle.close === 'number' && !isNaN(candle.close);
  }

  /**
   * Check if position is open
   */
  public hasPosition(): boolean {
    return this.position !== null;
  }

  /**
   * Get current position
   */
  public getPosition(): Position | null {
    return this.position;
  }

  /**
   * Calculate backtest statistics
   */
  public getResults(): BacktestResult {
    const stats = this.calculateStatistics();

    return {
      trades: this.trades,
      equity: this.equity,
      timestamps: this.timestamps,
      statistics: stats,
    };
  }

  /**
   * Calculate detailed statistics
   */
  private calculateStatistics() {
    const totalTrades = this.trades.length;

    if (totalTrades === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        totalPnL: 0,
        totalPnLPercent: 0,
        avgWin: 0,
        avgLoss: 0,
        profitFactor: 0,
        maxDrawdown: 0,
        maxDrawdownPercent: 0,
        sharpeRatio: 0,
        longTrades: 0,
        shortTrades: 0,
        largestWin: 0,
        largestLoss: 0,
        avgTradeDuration: 0,
        expectancy: 0,
      };
    }

    const winningTrades = this.trades.filter((t) => t.pnl > 0);
    const losingTrades = this.trades.filter((t) => t.pnl <= 0);
    const longTrades = this.trades.filter((t) => t.direction === "long").length;
    const shortTrades = this.trades.filter((t) => t.direction === "short").length;

    const totalPnL = this.trades.reduce((sum, t) => sum + t.pnl, 0);
    const totalPnLPercent = ((this.capital - this.config.initialCapital) / this.config.initialCapital) * 100;

    const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));

    const avgWin = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;

    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;

    // Calculate max drawdown
    let maxEquity = this.equity[0];
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;

    for (const eq of this.equity) {
      if (eq > maxEquity) {
        maxEquity = eq;
      }
      const drawdown = maxEquity - eq;
      const drawdownPercent = (drawdown / maxEquity) * 100;

      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        maxDrawdownPercent = drawdownPercent;
      }
    }

    // Calculate Sharpe ratio (simplified)
    const returns: number[] = [];
    for (let i = 1; i < this.equity.length; i++) {
      const ret = (this.equity[i] - this.equity[i - 1]) / this.equity[i - 1];
      returns.push(ret);
    }

    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance =
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) /
      returns.length;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized

    // Largest win/loss
    const largestWin = winningTrades.length > 0
      ? Math.max(...winningTrades.map((t) => t.pnl))
      : 0;
    const largestLoss = losingTrades.length > 0
      ? Math.min(...losingTrades.map((t) => t.pnl))
      : 0;

    // Average trade duration (in milliseconds)
    const avgTradeDuration =
      this.trades.reduce((sum, t) => sum + (t.exitTime - t.entryTime), 0) /
      totalTrades;

    // Expectancy
    const winRate = winningTrades.length / totalTrades;
    const expectancy = winRate * avgWin - (1 - winRate) * avgLoss;

    return {
      totalTrades,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: (winningTrades.length / totalTrades) * 100,
      totalPnL,
      totalPnLPercent,
      avgWin,
      avgLoss,
      profitFactor,
      maxDrawdown,
      maxDrawdownPercent,
      sharpeRatio,
      longTrades,
      shortTrades,
      largestWin,
      largestLoss,
      avgTradeDuration,
      expectancy,
    };
  }

  /**
   * Reset the backtest engine
   */
  public reset(): void {
    this.capital = this.config.initialCapital;
    this.equity = [this.capital];
    this.timestamps = [];
    this.trades = [];
    this.position = null;
  }
}
