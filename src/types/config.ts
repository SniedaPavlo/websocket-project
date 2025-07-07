export interface HTTPConfig {
  url: string;
  pollInterval?: number;
  timeout?: number;
}

export interface ChartConfig {
  colors?: {
    background?: string;
    border?: string;
    line?: string;
    text?: string;
    block?: string;
  };
  dimensions?: {
    width?: number;
    height?: number;
  };
  responsive?: {
    mobile?: {
      blocksPerRow?: number;
      blocksPerColumn?: number;
    };
    tablet?: {
      blocksPerRow?: number;
      blocksPerColumn?: number;
    };
    desktop?: {
      blocksPerRow?: number;
      blocksPerColumn?: number;
    };
  };
}

export interface SolPriceChartConfig {
  http?: HTTPConfig;
  chart?: ChartConfig;
  features?: {
    showPriceDisplay?: boolean;
    showControls?: boolean;
    autoScale?: boolean;
  };
}