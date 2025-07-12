import React from "react";
import { Chart } from "./components/TradingChart/Chart";
import { PriceDisplay } from "./components/TradingChart/PriceDisplay";
import { ApiTester } from "./components/ApiTester";
import { useResponsive } from "./hooks/useResponsive";
import ErrorBoundary from "./components/ErrorBoundary";
import "./App.scss";

const App: React.FC = () => {
  // Mock data - no actual price requests
  const priceData: any[] = [];
  const currentPrice = 0;
  const isConnected = false;
  const clearData = () => {};

  const { isMobile, windowSize } = useResponsive();

  const chartHeight = isMobile ? 300 : 500;
  const chartWidth = Math.min(windowSize.width - 40, 1200);

  return (
    <div className="app">
      <ApiTester />
      <div className="app-container">
        <header className="header">
          <div className="header-content">
            <div className="title-section">
              <h1>SOL Price Tracker</h1>
              <p className="subtitle">Real-time Solana price monitoring</p>
            </div>
            <div className="price-section">
              <PriceDisplay price={currentPrice} isConnected={isConnected} />
            </div>
          </div>
        </header>

        <main className="main-content">
          <div className="dashboard">
            <div className="chart-section">
              <ErrorBoundary>
                <div className="chart-wrapper">
                  <Chart
                    //@ts-ignore
                    priceData={priceData}
                    width={chartWidth}
                    height={chartHeight}
                  />
                </div>
              </ErrorBoundary>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
