import React, { useRef, useEffect, useState, useCallback } from "react";
import { ChartBlock, GridCell, GridConfig, PriceData } from "@/types";
import { BlockGrid } from "../BlockGrid";
import { Line } from "./Line/Line";
import { generateBlocksGrid } from "../../../libs/utils/chartUtils";
import { useResponsive } from "../../../hooks/useResponsive";
import { useWebSocketPrice } from "../../../hooks/useWebSocketPrice";
import styles from "./Chart.module.scss";

// Generate price zones based on the current price
const generatePriceZones = (currentPrice: number) => {
  const basePrice = Math.floor(currentPrice * 100) / 100;
  const step = 0.05;

  return [
    {
      row: 0,
      priceMin: basePrice + step * 3,
      priceMax: basePrice + step * 4,
      label: "Zone 4",
    },
    {
      row: 1,
      priceMin: basePrice + step * 2,
      priceMax: basePrice + step * 3,
      label: "Zone 3",
    },
    {
      row: 2,
      priceMin: basePrice + step,
      priceMax: basePrice + step * 2,
      label: "Zone 2",
    },
    {
      row: 3,
      priceMin: basePrice,
      priceMax: basePrice + step,
      label: "Zone 1",
    },
  ];
};

interface ChartProps {
  feed?: string;
  width?: number;
  height?: number;
  className?: string;
}

const GAME_DURATION = 30000;
const UPDATE_INTERVAL = 100;

export const Chart: React.FC<ChartProps> = ({
  feed = "SOL_USD",
  width = 800,
  height = 400,
  className = "",
}) => {
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

  const [gameState, setGameState] = useState({
    gameNumber: 0,
    startTime: Date.now(),
    priceHistory: [] as PriceData[],
    currentColumnIndex: 0,
  });

  const [allGamesData, setAllGamesData] = useState<
    {
      columnIndex: number;
      data: PriceData[];
      startTime: number;
    }[]
  >([]);

  const [priceZones, setPriceZones] = useState<any[]>([]);

  const { blockConfig } = useResponsive();
  const { priceData, isConnected } = useWebSocketPrice({ feed });

  // Update price zones
  useEffect(() => {
    if (priceData.length > 0) {
      const latestPrice = priceData[priceData.length - 1].price;
      setPriceZones(generatePriceZones(latestPrice));
    }
  }, [priceData]);

  // Game logic
  useEffect(() => {
    if (priceData.length === 0) return;

    const intervalId = setInterval(() => {
      const now = Date.now();
      const gameElapsed = now - gameState.startTime;

      if (gameElapsed >= GAME_DURATION) {
        // Save current game data
        if (gameState.priceHistory.length > 0) {
          setAllGamesData((prev) => [
            ...prev,
            {
              columnIndex: gameState.currentColumnIndex,
              data: gameState.priceHistory,
              startTime: gameState.startTime,
            },
          ]);
        }

        // Move to the next column
        const nextColumnIndex = gameState.currentColumnIndex + 1;

        setGameState({
          gameNumber: gameState.gameNumber + 1,
          startTime: now,
          priceHistory: [],
          currentColumnIndex:
            nextColumnIndex >= blockConfig.blocksPerRow ? 0 : nextColumnIndex,
        });
      } else {
        // Add current price
        const latestPrice = priceData[priceData.length - 1];
        if (latestPrice) {
          setGameState((prev) => ({
            ...prev,
            priceHistory: [
              ...prev.priceHistory,
              {
                price: latestPrice.price,
                timestamp: now,
              },
            ],
          }));
        }
      }
    }, UPDATE_INTERVAL);

    return () => clearInterval(intervalId);
  }, [
    gameState.startTime,
    gameState.gameNumber,
    gameState.currentColumnIndex,
    blockConfig.blocksPerRow,
    priceData,
  ]);

  // Grid calculation
  const calculateGrid = useCallback(() => {
    if (chartDimensions.width === 0 || chartDimensions.height === 0) return;

    const cols = blockConfig.blocksPerRow;
    const rows = blockConfig.blocksPerColumn;
    const gap = Math.max(1, Math.min(4, chartDimensions.width / 200));
    const availableWidth = chartDimensions.width - gap * (cols - 1);
    const availableHeight = chartDimensions.height - gap * (rows - 1);
    const cellSize = Math.min(availableWidth / cols, availableHeight / rows);
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

  // Generate blocks
  useEffect(() => {
    setBlocks(
      generateBlocksGrid(blockConfig.blocksPerRow, blockConfig.blocksPerColumn)
    );
  }, [blockConfig.blocksPerRow, blockConfig.blocksPerColumn]);

  // Update dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (chartContentRef.current) {
        const rect = chartContentRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setChartDimensions({ width: rect.width, height: rect.height });
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

  const gameProgress = Math.min(
    (Date.now() - gameState.startTime) / GAME_DURATION,
    1.0
  );

  return (
    <div
      className={`${styles.chart} ${className}`}
      style={{ width: width || "100%", height: height || "100%" }}
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
            priceData={gameState.priceHistory}
            chartDimensions={chartDimensions}
            isConnected={isConnected}
            gridCells={gridCells}
            gridConfig={gridConfig}
            gameProgress={gameProgress}
            gameNumber={gameState.gameNumber}
            currentColumnIndex={gameState.currentColumnIndex}
            gameStartTime={gameState.startTime}
            allGamesData={allGamesData}
            priceZones={priceZones}
          />
        </div>
      </div>
    </div>
  );
};
