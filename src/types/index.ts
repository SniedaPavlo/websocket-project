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
  potValue?: string;
  mainText?: string;
  subText?: string;
}

// Re-export config types
export type {
  HTTPConfig,
  ChartConfig,
  SolPriceChartConfig
} from './config';
