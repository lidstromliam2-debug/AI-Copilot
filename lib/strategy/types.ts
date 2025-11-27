// lib/strategy/types.ts
// Core types for institutional-grade dynamic strategy engine

export type LogicalOperator = 'AND' | 'OR';
export type ComparisonOperator = 'crossesAbove' | 'crossesBelow' | 'greaterThan' | 'lessThan' | 'equals' | 'notEquals';

export interface IndicatorSpec {
  indicator: string;
  period?: number;
  fastPeriod?: number;
  slowPeriod?: number;
  signalPeriod?: number;
  source?: string; // e.g. 'close', 'open', 'high', 'low', 'volume'
  timeframe?: string; // for multi-timeframe logic
  params?: Record<string, any>;
}

export interface RuleCondition {
  left: IndicatorSpec | { value: number };
  op: ComparisonOperator;
  right?: IndicatorSpec | { value: number };
}

export interface StrategyRule {
  entry: RuleCondition[];
  exit: RuleCondition[];
  takeProfit?: RuleCondition[];
  stopLoss?: RuleCondition[];
  trailingStop?: RuleCondition[];
  filters?: RuleCondition[];
  logic?: LogicalOperator;
  timeRules?: TimeRule[];
  positionSizing?: PositionSizingRule;
}

export interface TimeRule {
  type: 'timeOfDay' | 'dayOfWeek' | 'session';
  value: string;
}

export interface PositionSizingRule {
  model: 'fixed' | 'percent' | 'risk' | 'volatility' | 'custom';
  value: number;
  maxLeverage?: number;
  minSize?: number;
  maxSize?: number;
}

export interface DynamicStrategy {
  name: string;
  description: string;
  rules: StrategyRule;
  indicators: IndicatorSpec[];
  params?: Record<string, any>;
}

export interface Trade {
  entryTime: number;
  exitTime: number;
  direction: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  size: number;
  pnl: number;
  pnlPercent: number;
  commission: number;
  reason?: string;
}

export interface BacktestResult {
  trades: Trade[];
  equity: number[];
  timestamps: number[];
  statistics: Record<string, number>;
  provenance: Provenance;
}

export interface Provenance {
  strategyJson: any;
  dataSource: string;
  dataRange: { start: string; end: string };
  requestId: string;
  seed: string;
  llmPrompt: string;
  engineVersion: string;
}

export interface ValidationError {
  field: string;
  message: string;
}
