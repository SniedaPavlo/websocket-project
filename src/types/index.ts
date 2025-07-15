export interface PriceData {
  timestamp: number;
  price: number;
}

export interface ChartBlock {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isActive: boolean;
  onClick?: () => void;
  row?: number;
  col?: number;
  bananas?: number;
  mainText?: string;
  subText?: string;
}

export interface GridCell {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface GridConfig {
  cellWidth: number;
  cellHeight: number;
  gap: number;
  cols: number;
  rows: number;
}

// Re-export config types
export type { HTTPConfig, ChartConfig, SolPriceChartConfig } from "./config";
