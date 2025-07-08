import React from "react";
import { Chart } from "./components/Chart";
import { PriceDisplay } from "./components/PriceDisplay";
import { useResponsive } from "./hooks/useResponsive";
import ErrorBoundary from "./components/ErrorBoundary";

export interface SolPriceChartProps {
  /** HTTP URL for price data */
  httpUrl?: string;
  /** Chart width */
  width?: number;
  /** Chart height */
  height?: number;
  /** Show price display */
  showPriceDisplay?: boolean;
  /** Show clear data button */
  showControls?: boolean;
  /** Custom className */
  className?: string;
  /** Chart colors configuration */
  colors?: {
    background?: string;
    border?: string;
    line?: string;
    text?: string;
  };
}

const SolPriceChart: React.FC<SolPriceChartProps> = ({
  httpUrl = "https://bananazone.app/feed/SOL_USD",
  width,
  height,
  showPriceDisplay = true,
  showControls = true,
  className = "",
  colors = {
    background: "#1A1A1A",
    border: "#272729",
    line: "#13AE5C",
    text: "#FFFFFF",
  },
}) => {
  // Mock data for demonstration - no actual price requests
  const priceData: any[] = [];
  const currentPrice = 0;
  const isConnected = false;
  const clearData = () => {};

  const { isMobile, windowSize } = useResponsive();

  const chartHeight = height || (isMobile ? 300 : 500);
  const chartWidth = width || Math.min(windowSize.width - 40, 1200);

  const chartStyle = {
    "--chart-bg": colors.background,
    "--chart-border": colors.border,
    "--chart-line": colors.line,
    "--chart-text": colors.text,
  } as React.CSSProperties;

  return (
    <div className={`sol-price-chart ${className}`} style={chartStyle}>
      {showPriceDisplay && (
        <PriceDisplay price={currentPrice} isConnected={isConnected} />
      )}

      <ErrorBoundary>
        <Chart priceData={priceData} width={chartWidth} height={chartHeight} />
      </ErrorBoundary>

      {showControls && (
        <div className="chart-controls">
          <button onClick={clearData} className="clear-button">
            Clear Data
          </button>
          <div className="chart-info">
            <span>Data points: {priceData.length}</span>
            <span>Status: {isConnected ? "🟢 Live" : "🔴 Disconnected"}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SolPriceChart;
