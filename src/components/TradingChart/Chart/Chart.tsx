import React, { useRef, useEffect, useState, useCallback } from "react";
import { PriceData, ChartBlock } from "@/types";
import { BlockGrid } from "../BlockGrid";
import {
  generateBlocksGrid,
  normalizePrice,
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [blocks, setBlocks] = useState<ChartBlock[]>([]);
  const [chartDimensions, setChartDimensions] = useState({
    width: 0,
    height: 0,
  });
  const { blockConfig } = useResponsive();

  // Получение данных WebSocket
  const { priceData, isConnected } = useWebSocketPrice({ feed });

  // Состояние загрузки WebSocket
  const [isLoadingWebSocket, setIsLoadingWebSocket] = useState(false);
  const [filteredPriceData, setFilteredPriceData] = useState<PriceData[]>([]);
  const [webSocketStartTime, setWebSocketStartTime] = useState<number | null>(
    null
  );

  // Функция загрузки WebSocket
  const LoadingWebSocket = useCallback(() => {
    if (isConnected && !isLoadingWebSocket && webSocketStartTime === null) {
      console.log("🔄 Starting WebSocket loading phase...");
      setIsLoadingWebSocket(true);
      setWebSocketStartTime(Date.now());
      setFilteredPriceData([]); // Clear any existing data

      // Запуск таймера на 2 секунды
      const timer = setTimeout(() => {
        console.log(
          "✅ WebSocket loading phase completed. Starting to accept data..."
        );
        setIsLoadingWebSocket(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isConnected, isLoadingWebSocket, webSocketStartTime]);

  // Запуск LoadingWebSocket при подключении
  useEffect(() => {
    LoadingWebSocket();
  }, [LoadingWebSocket]);

  // Фильтрация данных о цене в зависимости от состояния загрузки
  useEffect(() => {
    if (!isLoadingWebSocket && webSocketStartTime !== null) {
      // Принимать только данные, пришедшие после 2-секундной загрузки
      const acceptableData = priceData.filter((data) => {
        // Если у данных есть timestamp, используем его, иначе текущее время
        const dataTime = data.timestamp || Date.now();
        return dataTime > webSocketStartTime + 2000;
      });

      setFilteredPriceData(acceptableData);
      console.log("📊 Filtered price data:", {
        totalData: priceData.length,
        filteredData: acceptableData.length,
        isLoadingWebSocket,
        webSocketStartTime,
      });
    } else {
      // Во время загрузки держим фильтрованные данные пустыми
      setFilteredPriceData([]);
    }
  }, [priceData, isLoadingWebSocket, webSocketStartTime]);

  // Сброс состояния WebSocket при отключении
  useEffect(() => {
    if (!isConnected) {
      setIsLoadingWebSocket(false);
      setWebSocketStartTime(null);
      setFilteredPriceData([]);
      console.log("🔌 WebSocket disconnected. Resetting state...");
    }
  }, [isConnected]);

  // Отладка
  useEffect(() => {
    console.log("📊 Chart data:", {
      priceDataLength: priceData.length,
      filteredDataLength: filteredPriceData.length,
      isConnected,
      isLoadingWebSocket,
      webSocketStartTime,
      lastPrice: filteredPriceData[filteredPriceData.length - 1],
    });
  }, [
    priceData,
    filteredPriceData,
    isConnected,
    isLoadingWebSocket,
    webSocketStartTime,
  ]);

  // Инициализация блоков
  useEffect(() => {
    const newBlocks = generateBlocksGrid(
      blockConfig.blocksPerRow,
      blockConfig.blocksPerColumn
    );
    setBlocks(newBlocks);
  }, [blockConfig.blocksPerRow, blockConfig.blocksPerColumn]);

  // Обработка изменения размера контейнера
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const newWidth = rect.width || width;
        const newHeight = rect.height || height;

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
  }, [width, height]);

  // Рисование графика
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (
      !canvas ||
      !ctx ||
      chartDimensions.width === 0 ||
      chartDimensions.height === 0
    ) {
      return;
    }

    // Настройка canvas
    const dpr = window.devicePixelRatio || 1;
    canvas.width = chartDimensions.width * dpr;
    canvas.height = chartDimensions.height * dpr;
    canvas.style.width = `${chartDimensions.width}px`;
    canvas.style.height = `${chartDimensions.height}px`;
    ctx.scale(dpr, dpr);

    // Очистка canvas
    ctx.clearRect(0, 0, chartDimensions.width, chartDimensions.height);

    // Показать состояние загрузки во время инициализации WebSocket
    if (isLoadingWebSocket) {
      ctx.fillStyle = "#FFD700";
      ctx.fillRect(10, 10, 120, 50);
      ctx.fillStyle = "#000000";
      ctx.font = "12px Arial";
      ctx.fillText("Loading...", 20, 30);
      ctx.fillText("Please wait 2s", 20, 45);

      // Статус соединения
      ctx.font = "12px Arial";
      ctx.fillStyle = "#FFD700";
      ctx.fillText("● LOADING", chartDimensions.width - 80, 20);

      return;
    }

    // Нарисовать линию цены, если есть фильтрованные данные
    if (filteredPriceData.length > 1) {
      const { min, max } = getMinMaxPrice(filteredPriceData);
      const padding = (max - min) * 0.1 || 1;
      const minPrice = min - padding;
      const maxPrice = max + padding;

      // Вычислить расстояние между точками, чтобы заполнить график слева направо
      const pointSpacing =
        chartDimensions.width / Math.max(100, filteredPriceData.length);
      const startX = 0; // Всегда начинать с начала

      // Создать градиент с более частыми переходами
      const gradient = ctx.createLinearGradient(0, 0, chartDimensions.width, 0);

      gradient.addColorStop(0.0, "#FAE279");
      gradient.addColorStop(0.05, "#FBEBB0");
      gradient.addColorStop(0.1, "#E9BD49");
      gradient.addColorStop(0.15, "#FCE57C");
      gradient.addColorStop(0.2, "#FAE279");
      gradient.addColorStop(0.25, "#FBEBB0");
      gradient.addColorStop(0.3, "#E9BD49");
      gradient.addColorStop(0.35, "#FCE57C");
      gradient.addColorStop(0.4, "#FAE279");
      gradient.addColorStop(0.45, "#FBEBB0");
      gradient.addColorStop(0.5, "#E9BD49");
      gradient.addColorStop(0.55, "#FCE57C");
      gradient.addColorStop(0.6, "#FAE279");
      gradient.addColorStop(0.65, "#FBEBB0");
      gradient.addColorStop(0.7, "#E9BD49");
      gradient.addColorStop(0.75, "#FCE57C");
      gradient.addColorStop(0.8, "#FAE279");
      gradient.addColorStop(0.85, "#FBEBB0");
      gradient.addColorStop(0.9, "#E9BD49");
      gradient.addColorStop(0.95, "#FCE57C");
      gradient.addColorStop(1.0, "#FAE279");

      // Нарисовать линию
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3.3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();

      filteredPriceData.forEach((data, i) => {
        const x = startX + i * pointSpacing;
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
      });

      ctx.stroke();

      // Нарисовать последнюю точку
      const lastData = filteredPriceData[filteredPriceData.length - 1];
      const lastX = startX + (filteredPriceData.length - 1) * pointSpacing;
      const lastNormalizedY =
        (lastData.price - minPrice) / (maxPrice - minPrice);
      const lastY =
        chartDimensions.height -
        lastNormalizedY * chartDimensions.height * 0.8 -
        20;

      ctx.fillStyle = "rgba(252, 229, 124, 0.3)";
      ctx.beginPath();
      ctx.arc(lastX, lastY, 12, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = "#FCE57C";
      ctx.beginPath();
      ctx.arc(lastX, lastY, 5, 0, 2 * Math.PI);
      ctx.fill();

      // Текст цены
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 14px Arial";
      ctx.fillText(`$${lastData.price.toFixed(2)}`, lastX + 10, lastY);
    } else if (isConnected && !isLoadingWebSocket) {
      // Ожидание данных после загрузки
      ctx.fillStyle = "#FF6B6B";
      ctx.fillRect(10, 10, 140, 50);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "12px Arial";
      ctx.fillText("Waiting for data...", 20, 30);
      ctx.fillText("Connected & Ready", 20, 45);
    } else {
      // Нет соединения
      ctx.fillStyle = "#FF0000";
      ctx.fillRect(10, 10, 120, 50);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "12px Arial";
      ctx.fillText("Not connected", 20, 30);
      ctx.fillText(`Status: ${isConnected}`, 20, 45);
    }

    // Статус соединения
    ctx.font = "12px Arial";
    if (isLoadingWebSocket) {
      ctx.fillStyle = "#FFD700";
      ctx.fillText("● LOADING", chartDimensions.width - 80, 20);
    } else {
      ctx.fillStyle = isConnected ? "#FCE57C" : "#FF0000";
      const statusText = isConnected ? "● LIVE" : "● OFFLINE";
      ctx.fillText(statusText, chartDimensions.width - 60, 20);
    }
  }, [filteredPriceData, chartDimensions, isConnected, isLoadingWebSocket]);

  const handleBlockClick = useCallback((blockId: string) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId ? { ...block, isActive: !block.isActive } : block
      )
    );
  }, []);

  // Ценовые метки - используем фильтрованные данные
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

        <div className={styles.chartContent}>
          <BlockGrid
            blocks={blocks}
            onBlockClick={handleBlockClick}
            className={styles.blockGrid}
            blocksPerRow={blockConfig.blocksPerRow}
            blocksPerColumn={blockConfig.blocksPerColumn}
          />
          <canvas ref={canvasRef} className={styles.canvas} />
        </div>
      </div>
    </div>
  );
};
