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

export interface HTTPResponse {
  data: [number, number][];
}

// Re-export config types
export type {
  HTTPConfig,
  ChartConfig,
  SolPriceChartConfig
} from './config';
