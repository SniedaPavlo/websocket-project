import React, { useRef, useEffect, useState, useCallback } from "react";
import { ChartBlock, GridCell, GridConfig } from "@/types";
import { BlockGrid } from "../BlockGrid";
import { Line } from "./Line/Line";
import {
  generateBlocksGrid,
  getMinMaxPrice,
} from "../../../libs/utils/chartUtils";
import { useResponsive } from "../../../hooks/useResponsive";
import { useWebSocketPrice } from "../../../hooks/useWebSocketPrice";
import styles from "./Chart.module.scss";

interface ChartProps {
  feed?: string;
  width?: number;
  height?: number;
  className?: string;
}

export const Chart: React.FC<ChartProps> = ({
  feed = "SOL_USD",
  width = 800,
  height = 400,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartContentRef = useRef<HTMLDivElement>(null);

  const [blocks, setBlocks] = useState<ChartBlock[]>([]);
  const [chartDimensions, setChartDimensions] = useState({
    width: 0,
    height: 0,
  });

  const [gridCells, setGridCells] = useState<GridCell[]>([]);
  const [gridConfig, setGridConfig] = useState<GridConfig>({
    cellWidth: 0,
    cellHeight: 0,
    gap: 0,
    cols: 0,
    rows: 0,
  });

  const { blockConfig } = useResponsive();
  const { priceData, isConnected } = useWebSocketPrice({ feed });

  const calculateGrid = useCallback(() => {
    if (chartDimensions.width === 0 || chartDimensions.height === 0) return;

    const cols = blockConfig.blocksPerRow;
    const rows = blockConfig.blocksPerColumn;
    const gap = Math.max(1, Math.min(4, chartDimensions.width / 200));
    const availableWidth = chartDimensions.width - gap * (cols - 1);
    const availableHeight = chartDimensions.height - gap * (rows - 1);
    const maxCellWidth = availableWidth / cols;
    const maxCellHeight = availableHeight / rows;
    const cellSize = Math.min(maxCellWidth, maxCellHeight);
    const totalGridWidth = cols * cellSize + (cols - 1) * gap;
    const totalGridHeight = rows * cellSize + (rows - 1) * gap;
    const offsetX = (chartDimensions.width - totalGridWidth) / 2;
    const offsetY = (chartDimensions.height - totalGridHeight) / 2;
    const cells: GridCell[] = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = offsetX + col * (cellSize + gap);
        const y = offsetY + row * (cellSize + gap);

        cells.push({
          x,
          y,
          width: cellSize,
          height: cellSize,
          centerX: x + cellSize / 2,
          centerY: y + cellSize / 2,
        });
      }
    }

    setGridCells(cells);
    setGridConfig({
      cellWidth: cellSize,
      cellHeight: cellSize,
      gap,
      cols,
      rows,
    });
  }, [chartDimensions, blockConfig]);

  useEffect(() => {
    const newBlocks = generateBlocksGrid(
      blockConfig.blocksPerRow,
      blockConfig.blocksPerColumn
    );
    setBlocks(newBlocks);
  }, [blockConfig.blocksPerRow, blockConfig.blocksPerColumn]);

  useEffect(() => {
    const updateDimensions = () => {
      if (chartContentRef.current) {
        const rect = chartContentRef.current.getBoundingClientRect();
        const newWidth = rect.width;
        const newHeight = rect.height;

        if (newWidth > 0 && newHeight > 0) {
          setChartDimensions({ width: newWidth, height: newHeight });
        }
      }
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (chartContentRef.current) {
      resizeObserver.observe(chartContentRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    calculateGrid();
  }, [calculateGrid]);

  const handleBlockClick = useCallback((blockId: string) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId ? { ...block, isActive: !block.isActive } : block
      )
    );
  }, []);

  return (
    <div
      ref={containerRef}
      className={`${styles.chart} ${className}`}
      style={{
        width: width || "100%",
        height: height || "100%",
      }}
    >
      <div className={styles.chartWrapper}>
        <div ref={chartContentRef} className={styles.chartContent}>
          <BlockGrid
            blocks={blocks}
            onBlockClick={handleBlockClick}
            className={styles.blockGrid}
            blocksPerRow={blockConfig.blocksPerRow}
            blocksPerColumn={blockConfig.blocksPerColumn}
            containerWidth={chartDimensions.width}
            containerHeight={chartDimensions.height}
            gridCells={gridCells}
            gridConfig={gridConfig}
          />
          <Line
            priceData={priceData}
            chartDimensions={chartDimensions}
            isConnected={isConnected}
            gridCells={gridCells}
            gridConfig={gridConfig}
            stopAtBlock={blockConfig.stopAtBlock}
          />
        </div>
      </div>
    </div>
  );
};
