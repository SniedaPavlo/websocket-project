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
  const blockGridRef = useRef<HTMLDivElement>(null);
  const [blocks, setBlocks] = useState<ChartBlock[]>([]);
  const [chartDimensions, setChartDimensions] = useState({
    width: 0,
    height: 0,
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

  // Function to get the exact block dimensions from the DOM
  const getActualBlockDimensions = useCallback(() => {
    if (
      !blockGridRef.current ||
      chartDimensions.width === 0 ||
      chartDimensions.height === 0
    ) {
      return {
        blockWidth: 0,
        blockHeight: 0,
        stopPosition: 0,
        totalWidth: chartDimensions.width,
        totalHeight: chartDimensions.height,
      };
    }

    // Get exact sizes from the DOM
    const containerRect = blockGridRef.current.getBoundingClientRect();
    const actualWidth = containerRect.width;
    const actualHeight = containerRect.height;

    const blockWidth = actualWidth / blockConfig.blocksPerRow;
    const blockHeight = actualHeight / blockConfig.blocksPerColumn;
    const stopPosition = blockWidth * blockConfig.stopAtBlock;

    return {
      blockWidth,
      blockHeight,
      stopPosition,
      totalWidth: actualWidth,
      totalHeight: actualHeight,
    };
  }, [chartDimensions, blockConfig, blockGridRef]);

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

  // Handle container resize
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

  // Chart drawing with perfect block synchronization
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

    // Draw price line if data available
    if (filteredPriceData.length > 1) {
      const { min, max } = getMinMaxPrice(filteredPriceData);
      const padding = (max - min) * 0.1 || 1;
      const minPrice = min - padding;
      const maxPrice = max + padding;

      // Get the exact block sizes
      const blockDims = getActualBlockDimensions();
      const { blockWidth, stopPosition } = blockDims;

      if (blockWidth === 0 || stopPosition === 0) {
        return; // Wait for correct initialization
      }

      // Adaptive distance between points
      let pointSpacing: number;
      if (blockConfig.blocksPerRow <= 7) {
        // Mobile/tablet - more frequent points
        pointSpacing = blockWidth / 6;
      } else {
        // Desktop - less frequent points
        pointSpacing = blockWidth / 4;
      }

      // Calculate the current movement position
      const currentPosition = Math.min(
        (filteredPriceData.length - 1) * pointSpacing,
        stopPosition
      );

      // Determine the number of points to display
      const maxPoints = Math.floor(stopPosition / pointSpacing) + 1;
      const dataToShow = filteredPriceData.slice(
        -Math.min(filteredPriceData.length, maxPoints)
      );

      // Create gradient
      const gradientWidth = Math.min(currentPosition, stopPosition);
      const gradient = ctx.createLinearGradient(0, 0, gradientWidth, 0);

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

      // Adaptive line thickness
      const lineWidth = Math.max(1.5, blockWidth * 0.03);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();

      // Draw the line
      dataToShow.forEach((data, i) => {
        let x: number;

        if (currentPosition >= stopPosition) {
          // Stopped - shift data to the left
          const offsetFromEnd = dataToShow.length - 1 - i;
          x = stopPosition - offsetFromEnd * pointSpacing;
        } else {
          // Moving from the start
          x = i * pointSpacing;
        }

        // Limit position
        x = Math.max(0, Math.min(x, stopPosition));

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

      // Draw the last point
      const lastData = dataToShow[dataToShow.length - 1];
      const lastX = Math.min(currentPosition, stopPosition);
      const lastNormalizedY =
        (lastData.price - minPrice) / (maxPrice - minPrice);
      const lastY =
        chartDimensions.height -
        lastNormalizedY * chartDimensions.height * 0.8 -
        20;

      // Adaptive point sizes
      const pointRadius = Math.max(2, blockWidth * 0.015);
      const pointOuterRadius = Math.max(6, blockWidth * 0.03);

      // Outer circle
      ctx.fillStyle = "rgba(252, 229, 124, 0.3)";
      ctx.beginPath();
      ctx.arc(lastX, lastY, pointOuterRadius, 0, 2 * Math.PI);
      ctx.fill();

      // Inner circle
      ctx.fillStyle = "#FCE57C";
      ctx.beginPath();
      ctx.arc(lastX, lastY, pointRadius, 0, 2 * Math.PI);
      ctx.fill();

      // Adaptive price text
      ctx.fillStyle = "#FFFFFF";
      const fontSize = Math.max(8, blockWidth * 0.04);
      ctx.font = `bold ${fontSize}px Arial`;
      const priceText = `${lastData.price.toFixed(2)}`;
      const textWidth = ctx.measureText(priceText).width;

      const textX =
        lastX + textWidth + 15 > chartDimensions.width
          ? lastX - textWidth - 10
          : lastX + 10;

      ctx.fillText(priceText, textX, lastY);

      // Stop line (when reached)
      if (currentPosition >= stopPosition) {
        ctx.strokeStyle = "rgba(252, 229, 124, 0.15)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(stopPosition, 0);
        ctx.lineTo(stopPosition, chartDimensions.height);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Debug block grid
      if (process.env.NODE_ENV === "development") {
        ctx.strokeStyle = "rgba(255, 0, 0, 0.1)";
        ctx.lineWidth = 0.5;
        ctx.setLineDash([1, 1]);

        // Vertical lines
        for (let i = 1; i <= blockConfig.blocksPerRow; i++) {
          const x = i * blockWidth;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, chartDimensions.height);
          ctx.stroke();
        }

        // Horizontal lines
        const blockHeight =
          chartDimensions.height / blockConfig.blocksPerColumn;
        for (let i = 1; i <= blockConfig.blocksPerColumn; i++) {
          const y = i * blockHeight;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(chartDimensions.width, y);
          ctx.stroke();
        }

        ctx.setLineDash([]);
      }
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
    getActualBlockDimensions,
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

        <div className={styles.chartContent}>
          <div ref={blockGridRef} className={styles.blockGridContainer}>
            <BlockGrid
              blocks={blocks}
              onBlockClick={handleBlockClick}
              className={styles.blockGrid}
              blocksPerRow={blockConfig.blocksPerRow}
              blocksPerColumn={blockConfig.blocksPerColumn}
            />
          </div>
          <canvas ref={canvasRef} className={styles.canvas} />
        </div>
      </div>
    </div>
  );
};
