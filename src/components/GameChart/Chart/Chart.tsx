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

// Функция для обработки данных с WebSocket
const processWebSocketData = (rawData: [number, number]): PriceData => {
  const [timestamp, rawPrice] = rawData;
  // Преобразуем цену: 16111248780 -> 161.11
  const price = rawPrice / 100000000;
  return {
    price: parseFloat(price.toFixed(2)),
    timestamp: timestamp * 1000, // конвертируем в миллисекунды
  };
};

// Функция для генерации зон котировок на основе текущей цены
const generatePriceZones = (currentPrice: number) => {
  const basePrice = Math.floor(currentPrice * 100) / 100; // Округляем до сотых
  const step = 0.05; // Шаг 5 центов

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

// Функция для получения зоны по строке
const getZoneByRow = (row: number, priceZones: any[]) => {
  return priceZones.find((zone) => zone.row === row) || priceZones[0];
};

// Функция для определения строки по цене
const getRowByPrice = (price: number, priceZones: any[]) => {
  for (const zone of priceZones) {
    if (price >= zone.priceMin && price <= zone.priceMax) {
      return zone.row;
    }
  }
  return priceZones.length - 1; // Возвращаем последнюю строку по умолчанию
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

  // Game state management
  const [gameState, setGameState] = useState<GameState>({
    gameNumber: 0,
    startTime: Date.now(),
    priceHistory: [],
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

  // Динамические зоны цен
  const [priceZones, setPriceZones] = useState<any[]>([]);

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

  // Обновляем зоны цен при изменении цены
  useEffect(() => {
    if (priceData.length > 0) {
      const latestPrice = priceData[priceData.length - 1].price;
      const newZones = generatePriceZones(latestPrice);
      setPriceZones(newZones);
    }
  }, [priceData]);

  // Логика игры с реальными данными WebSocket
  useEffect(() => {
    if (priceData.length === 0) return;

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
            currentColumnIndex: 0,
          });
        } else {
          // Start new game in next column
          setGameState((prev) => ({
            gameNumber: prev.gameNumber + 1,
            startTime: now,
            priceHistory: [],
            currentColumnIndex: nextColumnIndex,
          }));
        }
      } else {
        // Добавляем текущую цену в историю игры
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
    gameState.priceHistory.length,
    blockConfig.blocksPerRow,
    priceData,
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
            priceZones={priceZones}
          />
        </div>
      </div>
    </div>
  );
};
