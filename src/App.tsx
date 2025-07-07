import React from "react";
import { Chart } from "./components/Chart";
import { PriceDisplay } from "./components/PriceDisplay";
import { useSolPrice } from "./hooks/useSolPrice";
import { useResponsive } from "./hooks/useResponsive";
import ErrorBoundary from "./components/ErrorBoundary";
import "./App.scss";

const App: React.FC = () => {
  console.log("✅ App component is rendering");
  const { priceData, currentPrice, isConnected, clearData } = useSolPrice();
  const { isMobile, windowSize } = useResponsive();

  const chartHeight = isMobile ? 300 : 500;
  const chartWidth = Math.min(windowSize.width - 40, 1200);

  return (
    <div className="app">
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
                    priceData={priceData}
                    width={chartWidth}
                    height={chartHeight}
                  />
                </div>
              </ErrorBoundary>
            </div>

            <div className="sidebar">
              <div className="stats-panel">
                <h3>Statistics</h3>
                <div className="stat-item">
                  <span className="stat-label">Data Points</span>
                  <span className="stat-value">{priceData.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Status</span>
                  <span className="stat-value">
                    {isConnected ? "🟢 Live" : "🔴 Disconnected"}
                  </span>
                </div>
              </div>

              <div className="controls-panel">
                <h3>Controls</h3>
                <button onClick={clearData} className="clear-button">
                  Clear Data
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
