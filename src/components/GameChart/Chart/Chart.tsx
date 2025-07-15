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

// Функция для генерации случайной цены с учетом зон
const generateRandomPrice = (previousPrice?: number) => {
  const globalMin = Math.min(...PRICE_ZONES.map((z) => z.priceMin));
  const globalMax = Math.max(...PRICE_ZONES.map((z) => z.priceMax));
  const volatility = 0.01; // 1% волатильность

  if (previousPrice) {
    // Добавляем случайное изменение к предыдущей цене
    const change = (Math.random() - 0.5) * volatility;
    const newPrice = previousPrice + change;
    return newPrice; // Убираем ограничение границ
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  // Dynamic grid dimensions
  const [dynamicGridSize, setDynamicGridSize] = useState({
    totalCols: 0,
    totalRows: 0,
    minPrice: 0,
    maxPrice: 0,
  });

  // Game state management
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

  // Функция для обновления размеров сетки на основе данных
  const updateDynamicGridSize = useCallback(
    (allData: PriceData[], currentColumn: number) => {
      if (allData.length === 0) return;

      const prices = allData.map((p) => p.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      // Расширяем диапазон для зон
      const priceRange = maxPrice - minPrice;
      const padding = priceRange * 0.1;
      const expandedMin = minPrice - padding;
      const expandedMax = maxPrice + padding;

      // Определяем количество строк на основе диапазона цен
      const zoneHeight = PRICE_ZONES[0].priceMax - PRICE_ZONES[0].priceMin;
      const neededRows = Math.max(
        PRICE_ZONES.length,
        Math.ceil((expandedMax - expandedMin) / zoneHeight)
      );

      // Количество колонок - текущая + запас
      const neededCols = Math.max(currentColumn + 5, blockConfig.blocksPerRow);

      setDynamicGridSize({
        totalCols: neededCols,
        totalRows: neededRows,
        minPrice: expandedMin,
        maxPrice: expandedMax,
      });
    },
    [blockConfig.blocksPerRow]
  );

  // Генерация динамических зон цен
  const generateDynamicPriceZones = useCallback(() => {
    const { totalRows, minPrice, maxPrice } = dynamicGridSize;
    const zones = [];
    const priceStep = (maxPrice - minPrice) / totalRows;

    for (let i = 0; i < totalRows; i++) {
      zones.push({
        row: i,
        priceMin: minPrice + i * priceStep,
        priceMax: minPrice + (i + 1) * priceStep,
        label: `Zone ${i + 1}`,
      });
    }

    return zones;
  }, [dynamicGridSize]);

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

        // Move to next column/game (без ограничений)
        const nextColumnIndex = gameState.currentColumnIndex + 1;

        setGameState((prev) => ({
          gameNumber: prev.gameNumber + 1,
          startTime: now,
          priceHistory: [],
          lastKnownPrice: prev.lastKnownPrice,
          currentColumnIndex: nextColumnIndex,
        }));
      } else {
        // Генерируем новую цену без ограничений
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
  ]);

  // Обновляем размеры сетки при изменении данных
  useEffect(() => {
    const allPriceData: PriceData[] = [];
    allGamesData.forEach((game) => {
      allPriceData.push(...game.data);
    });
    if (gameState.priceHistory.length > 0) {
      allPriceData.push(...gameState.priceHistory);
    }

    if (allPriceData.length > 0) {
      updateDynamicGridSize(allPriceData, gameState.currentColumnIndex);
    }
  }, [
    allGamesData,
    gameState.priceHistory,
    gameState.currentColumnIndex,
    updateDynamicGridSize,
  ]);

  const calculateGrid = useCallback(() => {
    if (chartDimensions.width === 0 || chartDimensions.height === 0) return;

    const { totalCols, totalRows } = dynamicGridSize;
    if (totalCols === 0 || totalRows === 0) return;

    const gap = Math.max(1, Math.min(4, chartDimensions.width / 200));
    const cellSize = Math.min(
      (chartDimensions.width / totalCols) * 0.8,
      (chartDimensions.height / totalRows) * 0.8
    );

    const cells: GridCell[] = [];

    for (let row = 0; row < totalRows; row++) {
      for (let col = 0; col < totalCols; col++) {
        const x = col * (cellSize + gap);
        const y = row * (cellSize + gap);

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
      cols: totalCols,
      rows: totalRows,
    });
  }, [chartDimensions, dynamicGridSize]);

  // Генерация блоков на основе динамической сетки
  useEffect(() => {
    const { totalCols, totalRows } = dynamicGridSize;
    if (totalCols > 0 && totalRows > 0) {
      const newBlocks = generateBlocksGrid(totalCols, totalRows);
      setBlocks(newBlocks);
    }
  }, [dynamicGridSize]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const newWidth = rect.width;
        const newHeight = rect.height;

        if (newWidth > 0 && newHeight > 0) {
          setChartDimensions({ width: newWidth, height: newHeight });
        }
      }
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    calculateGrid();
  }, [calculateGrid]);

  // Автоматический скролл к текущей колонке
  useEffect(() => {
    if (scrollContainerRef.current && gridConfig.cellWidth > 0) {
      const currentX =
        gameState.currentColumnIndex * (gridConfig.cellWidth + gridConfig.gap);
      const containerWidth = scrollContainerRef.current.clientWidth;
      const scrollLeft = Math.max(0, currentX - containerWidth / 2);

      scrollContainerRef.current.scrollTo({
        left: scrollLeft,
        behavior: "smooth",
      });
    }
  }, [gameState.currentColumnIndex, gridConfig]);

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

  // Получаем динамические зоны цен
  const dynamicPriceZones = generateDynamicPriceZones();

  // Вычисляем общую ширину контента
  const contentWidth =
    gridConfig.cols * (gridConfig.cellWidth + gridConfig.gap);

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
        <div
          ref={scrollContainerRef}
          className={styles.scrollContainer}
          style={{
            width: "100%",
            height: "100%",
            overflowX: "auto",
            overflowY: "auto",
          }}
        >
          <div
            ref={chartContentRef}
            className={styles.chartContent}
            style={{
              width: Math.max(contentWidth, chartDimensions.width),
              height: Math.max(
                gridConfig.rows * (gridConfig.cellHeight + gridConfig.gap),
                chartDimensions.height
              ),
              position: "relative",
            }}
          >
            <BlockGrid
              blocks={blocks}
              onBlockClick={handleBlockClick}
              className={styles.blockGrid}
              blocksPerRow={gridConfig.cols}
              blocksPerColumn={gridConfig.rows}
              containerWidth={Math.max(contentWidth, chartDimensions.width)}
              containerHeight={Math.max(
                gridConfig.rows * (gridConfig.cellHeight + gridConfig.gap),
                chartDimensions.height
              )}
              gridCells={gridCells}
              gridConfig={gridConfig}
            />
            <Line
              priceData={gameState.priceHistory}
              chartDimensions={{
                width: Math.max(contentWidth, chartDimensions.width),
                height: Math.max(
                  gridConfig.rows * (gridConfig.cellHeight + gridConfig.gap),
                  chartDimensions.height
                ),
              }}
              isConnected={isConnected}
              gridCells={gridCells}
              gridConfig={gridConfig}
              gameProgress={gameProgress}
              gameNumber={gameState.gameNumber}
              currentColumnIndex={gameState.currentColumnIndex}
              gameStartTime={gameState.startTime}
              allGamesData={allGamesData}
              priceZones={dynamicPriceZones}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
