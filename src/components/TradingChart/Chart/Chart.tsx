import React, { useRef, useEffect, useState, useCallback } from "react";
import { PriceData, ChartBlock } from "@/types";
import { BlockGrid } from "../BlockGrid";
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

// Единая сетка для блоков и линии
interface GridCell {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export const Chart: React.FC<ChartProps> = ({
  feed = "SOL_USD",
  width = 800,
  height = 400,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartContentRef = useRef<HTMLDivElement>(null);

  const [blocks, setBlocks] = useState<ChartBlock[]>([]);
  const [chartDimensions, setChartDimensions] = useState({
    width: 0,
    height: 0,
  });

  // Единая сетка для блоков и линии
  const [gridCells, setGridCells] = useState<GridCell[]>([]);
  const [gridConfig, setGridConfig] = useState({
    cellWidth: 0,
    cellHeight: 0,
    gap: 0,
    cols: 0,
    rows: 0,
  });

  const { blockConfig } = useResponsive();

  // WebSocket data fetching
  const { priceData, isConnected } = useWebSocketPrice({ feed });

  // WebSocket loading state
  const [isLoadingWebSocket, setIsLoadingWebSocket] = useState(false);
  const [filteredPriceData, setFilteredPriceData] = useState<PriceData[]>([]);
  const [webSocketStartTime, setWebSocketStartTime] = useState<number | null>(
    null
  );

  // Вычисление единой сетки с КВАДРАТНЫМИ блоками
  const calculateGrid = useCallback(() => {
    if (chartDimensions.width === 0 || chartDimensions.height === 0) return;

    const cols = blockConfig.blocksPerRow;
    const rows = blockConfig.blocksPerColumn;

    // Вычисляем gap точно так же как в оригинальном BlockGrid
    const gap = Math.max(1, Math.min(4, chartDimensions.width / 200));

    // Доступное пространство для ячеек
    const availableWidth = chartDimensions.width - gap * (cols - 1);
    const availableHeight = chartDimensions.height - gap * (rows - 1);

    // Размер ячеек - ВСЕГДА квадратные
    const maxCellWidth = availableWidth / cols;
    const maxCellHeight = availableHeight / rows;

    // Выбираем минимальный размер для сохранения квадратной формы
    const cellSize = Math.min(maxCellWidth, maxCellHeight);

    // Рассчитываем реальные размеры сетки
    const totalGridWidth = cols * cellSize + (cols - 1) * gap;
    const totalGridHeight = rows * cellSize + (rows - 1) * gap;

    // Центрируем сетку в контейнере
    const offsetX = (chartDimensions.width - totalGridWidth) / 2;
    const offsetY = (chartDimensions.height - totalGridHeight) / 2;

    // Создаем массив ячеек сетки
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

  // WebSocket loading function
  const LoadingWebSocket = useCallback(() => {
    if (isConnected && !isLoadingWebSocket && webSocketStartTime === null) {
      console.log("🔄 Starting WebSocket loading phase...");
      setIsLoadingWebSocket(true);
      setWebSocketStartTime(Date.now());
      setFilteredPriceData([]);

      const timer = setTimeout(() => {
        console.log(
          "✅ WebSocket loading phase completed. Starting to accept data..."
        );
        setIsLoadingWebSocket(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isConnected, isLoadingWebSocket, webSocketStartTime]);

  useEffect(() => {
    LoadingWebSocket();
  }, [LoadingWebSocket]);

  // Filter price data depending on loading state
  useEffect(() => {
    if (!isLoadingWebSocket && webSocketStartTime !== null) {
      const acceptableData = priceData.filter((data) => {
        const dataTime = data.timestamp || Date.now();
        return dataTime > webSocketStartTime + 2000;
      });
      setFilteredPriceData(acceptableData);
    } else {
      setFilteredPriceData([]);
    }
  }, [priceData, isLoadingWebSocket, webSocketStartTime]);

  // Reset WebSocket state on disconnect
  useEffect(() => {
    if (!isConnected) {
      setIsLoadingWebSocket(false);
      setWebSocketStartTime(null);
      setFilteredPriceData([]);
      console.log("🔌 WebSocket disconnected. Resetting state...");
    }
  }, [isConnected]);

  // Blocks initialization
  useEffect(() => {
    const newBlocks = generateBlocksGrid(
      blockConfig.blocksPerRow,
      blockConfig.blocksPerColumn
    );
    setBlocks(newBlocks);
  }, [blockConfig.blocksPerRow, blockConfig.blocksPerColumn]);

  // Handle container resize and calculate grid
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

  // Пересчитываем сетку при изменении размеров
  useEffect(() => {
    calculateGrid();
  }, [calculateGrid]);

  // Chart drawing using unified grid
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx || gridCells.length === 0) {
      return;
    }

    // Canvas setup with exact dimensions
    const dpr = window.devicePixelRatio || 1;
    canvas.width = chartDimensions.width * dpr;
    canvas.height = chartDimensions.height * dpr;
    canvas.style.width = `${chartDimensions.width}px`;
    canvas.style.height = `${chartDimensions.height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, chartDimensions.width, chartDimensions.height);

    // Show loading state
    if (isLoadingWebSocket) {
      ctx.fillStyle = "#FFD700";
      ctx.fillRect(10, 10, 120, 50);
      ctx.fillStyle = "#000000";
      ctx.font = "12px Arial";
      ctx.fillText("Loading...", 20, 30);
      ctx.fillText("Please wait 2s", 20, 45);

      ctx.font = "12px Arial";
      ctx.fillStyle = "#FFD700";
      ctx.fillText("● LOADING", chartDimensions.width - 80, 20);
      return;
    }

    // Draw price line using unified grid
    if (filteredPriceData.length > 1) {
      const { min, max } = getMinMaxPrice(filteredPriceData);
      const padding = (max - min) * 0.1 || 1;
      const minPrice = min - padding;
      const maxPrice = max + padding;

      // Позиция остановки из сетки
      const stopAtCellIndex = blockConfig.stopAtBlock - 1; // 0-based
      const stopCell = gridCells[stopAtCellIndex];
      const stopPosition = stopCell ? stopCell.centerX : 0;

      // Максимальное количество точек до остановки
      const maxPointsBeforeStop = Math.min(
        stopAtCellIndex + 1,
        filteredPriceData.length
      );
      const dataToShow = filteredPriceData.slice(-maxPointsBeforeStop);

      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, stopPosition, 0);
      gradient.addColorStop(0.0, "#FAE279");
      gradient.addColorStop(0.1, "#E9BD49");
      gradient.addColorStop(0.2, "#FCE57C");
      gradient.addColorStop(0.3, "#FAE279");
      gradient.addColorStop(0.4, "#FBEBB0");
      gradient.addColorStop(0.5, "#E9BD49");
      gradient.addColorStop(0.6, "#FCE57C");
      gradient.addColorStop(0.7, "#FAE279");
      gradient.addColorStop(0.8, "#FBEBB0");
      gradient.addColorStop(0.9, "#E9BD49");
      gradient.addColorStop(1.0, "#FCE57C");

      // Размеры пропорциональны размеру ячейки
      const lineWidth = Math.max(1.5, gridConfig.cellWidth * 0.08);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();

      let lastX = 0;
      let lastY = 0;

      // Рисуем линию точно по центрам ячеек сетки
      dataToShow.forEach((data, i) => {
        let cellIndex: number;

        // Определяем индекс ячейки
        if (filteredPriceData.length > stopAtCellIndex + 1) {
          // Линия достигла остановки - сдвигаем данные влево
          cellIndex = stopAtCellIndex - (dataToShow.length - 1 - i);
        } else {
          // Линия еще движется
          cellIndex = i;
        }

        if (cellIndex < 0 || cellIndex >= gridCells.length) return;

        const cell = gridCells[cellIndex];
        const x = cell.centerX;

        // Y координата на основе цены
        const normalizedY = (data.price - minPrice) / (maxPrice - minPrice);
        const y =
          chartDimensions.height -
          normalizedY * chartDimensions.height * 0.8 -
          20;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        lastX = x;
        lastY = y;
      });

      ctx.stroke();

      // Рисуем последнюю точку
      const pointRadius = Math.max(2, gridConfig.cellWidth * 0.1);
      const pointOuterRadius = Math.max(6, gridConfig.cellWidth * 0.2);

      // Внешний круг
      ctx.fillStyle = "rgba(252, 229, 124, 0.3)";
      ctx.beginPath();
      ctx.arc(lastX, lastY, pointOuterRadius, 0, 2 * Math.PI);
      ctx.fill();

      // Внутренний круг
      ctx.fillStyle = "#FCE57C";
      ctx.beginPath();
      ctx.arc(lastX, lastY, pointRadius, 0, 2 * Math.PI);
      ctx.fill();

      // Текст цены
      const lastData = dataToShow[dataToShow.length - 1];
      ctx.fillStyle = "#FFFFFF";
      const fontSize = Math.max(8, gridConfig.cellWidth * 0.25);
      ctx.font = `bold ${fontSize}px Arial`;
      const priceText = `${lastData.price.toFixed(2)}`;
      const textWidth = ctx.measureText(priceText).width;

      const textX =
        lastX + textWidth + 15 > chartDimensions.width
          ? lastX - textWidth - 10
          : lastX + 10;

      ctx.fillText(priceText, textX, lastY);

      // Линия остановки
      if (filteredPriceData.length > stopAtCellIndex + 1) {
        ctx.strokeStyle = "rgba(252, 229, 124, 0.15)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(stopPosition, 0);
        ctx.lineTo(stopPosition, chartDimensions.height);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Debug: показать сетку - ОТКЛЮЧЕНО
      // if (process.env.NODE_ENV === "development") {
      //   ctx.strokeStyle = "rgba(0, 255, 0, 0.3)";
      //   ctx.lineWidth = 1;

      //   gridCells.forEach((cell, index) => {
      //     // Рамка ячейки
      //     ctx.strokeRect(cell.x, cell.y, cell.width, cell.height);

      //     // Центральная точка
      //     ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
      //     ctx.beginPath();
      //     ctx.arc(cell.centerX, cell.centerY, 2, 0, 2 * Math.PI);
      //     ctx.fill();

      //     // Номер ячейки
      //     ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      //     ctx.font = "10px Arial";
      //     ctx.fillText(index.toString(), cell.x + 2, cell.y + 12);
      //   });

      //   // Подсветка ячейки остановки
      //   if (stopCell) {
      //     ctx.strokeStyle = "rgba(255, 255, 0, 0.8)";
      //     ctx.lineWidth = 2;
      //     ctx.strokeRect(
      //       stopCell.x,
      //       stopCell.y,
      //       stopCell.width,
      //       stopCell.height
      //     );
      //   }
      // }
    } else if (isConnected && !isLoadingWebSocket) {
      // Waiting for data
      ctx.fillStyle = "#FF6B6B";
      ctx.fillRect(10, 10, 140, 50);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "12px Arial";
      ctx.fillText("Waiting for data...", 20, 30);
      ctx.fillText("Connected & Ready", 20, 45);
    } else {
      // No connection
      ctx.fillStyle = "#FF0000";
      ctx.fillRect(10, 10, 120, 50);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "12px Arial";
      ctx.fillText("Not connected", 20, 30);
      ctx.fillText(`Status: ${isConnected}`, 20, 45);
    }

    // Connection status
    ctx.font = "12px Arial";
    if (isLoadingWebSocket) {
      ctx.fillStyle = "#FFD700";
      ctx.fillText("● LOADING", chartDimensions.width - 80, 20);
    } else {
      ctx.fillStyle = isConnected ? "#FCE57C" : "#FF0000";
      const statusText = isConnected ? "● LIVE" : "● OFFLINE";
      ctx.fillText(statusText, chartDimensions.width - 60, 20);
    }
  }, [
    filteredPriceData,
    chartDimensions,
    isConnected,
    isLoadingWebSocket,
    gridCells,
    gridConfig,
    blockConfig,
  ]);

  const handleBlockClick = useCallback((blockId: string) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId ? { ...block, isActive: !block.isActive } : block
      )
    );
  }, []);

  // Price labels
  const priceLabels = React.useMemo(() => {
    if (filteredPriceData.length === 0) return [];

    const { min, max } = getMinMaxPrice(filteredPriceData);
    const padding = (max - min) * 0.1 || 1;
    const minPrice = min - padding;
    const maxPrice = max + padding;
    const steps = 5;

    return Array.from({ length: steps + 1 }, (_, i) => {
      const price = maxPrice - (maxPrice - minPrice) * (i / steps);
      return price.toFixed(2);
    });
  }, [filteredPriceData]);

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
        <div className={styles.priceLabels}>
          {priceLabels.map((price, i) => (
            <div key={i} className={styles.priceLabel}>
              ${price}
            </div>
          ))}
        </div>

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
          <canvas ref={canvasRef} className={styles.canvas} />
        </div>
      </div>
    </div>
  );
};
