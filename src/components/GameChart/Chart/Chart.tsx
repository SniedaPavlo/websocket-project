import React, { useRef, useEffect, useState, useCallback } from "react";
import { ChartBlock, GridCell, GridConfig, PriceData } from "@/types";
import { BlockGrid } from "../BlockGrid";
import { Line } from "./Line/Line";
import {
  generateBlocksGrid,
  getMinMaxPrice,
} from "../../../libs/utils/chartUtils";
import { useResponsive } from "../../../hooks/useResponsive";
import { useWebSocketPrice } from "../../../hooks/useWebSocketPrice";
import { BananaZoneClient } from "../../../libs/api";
import styles from "./Chart.module.scss";

// Конфигурация зон котировок по строкам (Y-координаты)
const PRICE_ZONES = [
  { row: 0, priceMin: 0.15, priceMax: 0.2, label: "Zone 4" },
  { row: 1, priceMin: 0.1, priceMax: 0.15, label: "Zone 3" },
  { row: 2, priceMin: 0.05, priceMax: 0.1, label: "Zone 2" },
  { row: 3, priceMin: 0.0, priceMax: 0.05, label: "Zone 1" },
];

// Функция для получения зоны по строке
const getZoneByRow = (row: number) => {
  return PRICE_ZONES.find((zone) => zone.row === row) || PRICE_ZONES[0];
};

// Функция для определения строку по цене
const getRowByPrice = (price: number) => {
  for (const zone of PRICE_ZONES) {
    if (price >= zone.priceMin && price <= zone.priceMax) {
      return zone.row;
    }
  }
  return PRICE_ZONES.length - 1; // Возвращаем последнюю строку по умолчанию
};

// Функция для ограничения цены глобальными границами
const constrainPrice = (price: number) => {
  const globalMin = Math.min(...PRICE_ZONES.map((z) => z.priceMin));
  const globalMax = Math.max(...PRICE_ZONES.map((z) => z.priceMax));
  return Math.max(globalMin, Math.min(globalMax, price));
};

// Функция для генерации случайной цены с учетом зон
const generateRandomPrice = (previousPrice?: number) => {
  const globalMin = Math.min(...PRICE_ZONES.map((z) => z.priceMin));
  const globalMax = Math.max(...PRICE_ZONES.map((z) => z.priceMax));
  const volatility = 0.01; // 1% волатильность

  if (previousPrice) {
    // Добавляем случайное изменение к предыдущей цене
    const change = (Math.random() - 0.5) * volatility;
    const newPrice = previousPrice + change;
    return constrainPrice(newPrice);
  } else {
    // Генерируем случайную цену в глобальном диапазоне
    return globalMin + Math.random() * (globalMax - globalMin);
  }
};

interface ChartProps {
  feed?: string;
  width?: number;
  height?: number;
  className?: string;
}

interface GameState {
  gameNumber: number;
  startTime: number;
  priceHistory: PriceData[];
  lastKnownPrice: number | null;
  currentColumnIndex: number;
}

const GAME_DURATION = 30000; // 30 seconds in milliseconds
const UPDATE_INTERVAL = 100; // Update visualization every 100ms for smooth animation
const SECONDS_PER_GAME = 30;

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

  // Game state management - возвращаем к оригинальной логике колонок
  const [gameState, setGameState] = useState<GameState>({
    gameNumber: 0,
    startTime: Date.now(),
    priceHistory: [],
    lastKnownPrice: null,
    currentColumnIndex: 0,
  });

  // All historical price data across all games
  const [allGamesData, setAllGamesData] = useState<
    {
      columnIndex: number;
      data: PriceData[];
      startTime: number;
    }[]
  >([]);

  const { blockConfig } = useResponsive();
  const { priceData, isConnected } = useWebSocketPrice({ feed });

  // Initialize competition data
  useEffect(() => {
    const fetchCompetition = async () => {
      try {
        const client = new BananaZoneClient();
        const competitions = await client.competitions.getAll();
        console.log("Competition data:", competitions[0]);
      } catch (error) {
        console.error("Failed to fetch competition:", error);
      }
    };

    fetchCompetition();
  }, []);

  // Генерация цен с учетом зон
  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = Date.now();
      const gameElapsed = now - gameState.startTime;

      // Check if current game should end
      if (gameElapsed >= GAME_DURATION) {
        // Save current game data before moving to next
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

        // Move to next column/game
        const nextColumnIndex = gameState.currentColumnIndex + 1;

        // Check if we've filled all columns
        if (nextColumnIndex >= blockConfig.blocksPerRow) {
          // Reset to beginning but keep history
          setGameState({
            gameNumber: gameState.gameNumber + 1,
            startTime: now,
            priceHistory: [],
            lastKnownPrice: gameState.lastKnownPrice,
            currentColumnIndex: 0,
          });
        } else {
          // Start new game in next column
          setGameState((prev) => ({
            gameNumber: prev.gameNumber + 1,
            startTime: now,
            priceHistory: [],
            lastKnownPrice: prev.lastKnownPrice,
            currentColumnIndex: nextColumnIndex,
          }));
        }
      } else {
        // Генерируем новую цену
        const newPrice = generateRandomPrice(
          gameState.lastKnownPrice || undefined
        );

        const newPricePoint: PriceData = {
          price: newPrice,
          timestamp: now,
        };

        setGameState((prev) => ({
          ...prev,
          priceHistory: [...prev.priceHistory, newPricePoint],
          lastKnownPrice: newPrice,
        }));
      }
    }, UPDATE_INTERVAL);

    return () => clearInterval(intervalId);
  }, [
    gameState.startTime,
    gameState.gameNumber,
    gameState.lastKnownPrice,
    gameState.currentColumnIndex,
    gameState.priceHistory.length,
    blockConfig.blocksPerRow,
  ]);

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

  // Calculate game progress for visualization
  const gameProgress = Math.min(
    (Date.now() - gameState.startTime) / GAME_DURATION,
    1.0
  );

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
            priceZones={PRICE_ZONES}
          />
        </div>
      </div>
    </div>
  );
};
