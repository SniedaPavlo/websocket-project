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

export interface WebSocketMessage {
  data: [number, number][];
}

// Re-export config types
export type {
  WebSocketConfig,
  ChartConfig,
  SolPriceChartConfig
} from './config';
