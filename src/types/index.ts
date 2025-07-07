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
}

// Re-export config types
export type {
  HTTPConfig,
  ChartConfig,
  SolPriceChartConfig
} from './config';
