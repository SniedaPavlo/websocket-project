import React from "react";

interface StatsPanelProps {
  priceData: Array<any>;
  isConnected: boolean;
  onClearData: () => void;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  priceData,
  isConnected,
  onClearData,
}) => {
  return (
    <div className="stats-panel-wrapper">
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
        <button onClick={onClearData} className="clear-button">
          Clear Data
        </button>
      </div>
    </div>
  );
};