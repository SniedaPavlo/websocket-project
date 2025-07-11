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
  priceData?: PriceData[]; // Optional external price data
  feed?: string; // WebSocket feed name (e.g., 'SOL_USD')
  useWebSocket?: boolean; // Enable WebSocket connection
  width?: number;
  height?: number;
  className?: string;
}

export const Chart: React.FC<ChartProps> = ({
  priceData: externalPriceData,
  feed = "SOL_USD",
  useWebSocket = true,
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

  // Debug props
  console.log("🎨 Chart props:", {
    externalPriceData,
    feed,
    useWebSocket,
    width,
    height,
  });

  // Use WebSocket hook for real-time price data
  const hookResult = useWebSocketPrice({
    feed,
    maxDataPoints: 100,
  });

  console.log("🪝 Hook result:", {
    priceDataLength: hookResult.priceData?.length || 0,
    isConnected: hookResult.isConnected,
    priceDataType: typeof hookResult.priceData,
    priceDataIsArray: Array.isArray(hookResult.priceData),
    firstItem: hookResult.priceData?.[0],
    lastItem: hookResult.priceData?.[hookResult.priceData.length - 1],
  });

  const {
    priceData: webSocketPriceData,
    isConnected,
  } = hookResult;

  // Determine which price data to use
  const priceData =
    externalPriceData && externalPriceData.length > 0
      ? externalPriceData
      : webSocketPriceData || [];

  console.log("📊 Final priceData:", {
    source:
      externalPriceData && externalPriceData.length > 0
        ? "external"
        : "websocket",
    length: priceData?.length || 0,
    type: typeof priceData,
    isArray: Array.isArray(priceData),
    isNull: priceData === null,
    isUndefined: priceData === undefined,
    sample: priceData?.slice(0, 3),
  });

  // Debug logging
  useEffect(() => {
    console.log("📈 Chart state update:", {
      priceDataLength: priceData?.length || 0,
      webSocketDataLength: webSocketPriceData?.length || 0,
      externalDataLength: externalPriceData?.length || 0,
      isConnected,
      useWebSocket,
      chartDimensions,
      lastPrice: priceData?.[priceData?.length - 1],
      firstPrice: priceData?.[0],
    });
  }, [
    priceData,
    webSocketPriceData,
    externalPriceData,
    isConnected,
    useWebSocket,
    chartDimensions,
  ]);

  // Initialize blocks
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

        console.log("Updating chart dimensions:", {
          width: newWidth,
          height: newHeight,
        });

        if (newWidth > 0 && newHeight > 0) {
          setChartDimensions({
            width: newWidth,
            height: newHeight,
          });
        }
      }
    };

    // Initial dimension update
    updateDimensions();

    // Create ResizeObserver
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Also listen to window resize as fallback
    window.addEventListener("resize", updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDimensions);
    };
  }, [width, height]);

  // Canvas drawing logic
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    console.log("🎨 Canvas effect triggered:", {
      canvas: !!canvas,
      ctx: !!ctx,
      priceData: priceData?.length || 0,
      dimensions: chartDimensions,
    });

    if (
      !canvas ||
      !ctx ||
      chartDimensions.width === 0 ||
      chartDimensions.height === 0
    ) {
      console.log("❌ Canvas not ready:", {
        canvas: !!canvas,
        ctx: !!ctx,
        width: chartDimensions.width,
        height: chartDimensions.height,
      });
      return;
    }

    // Clear and setup canvas
    const dpr = window.devicePixelRatio || 1;
    canvas.width = chartDimensions.width * dpr;
    canvas.height = chartDimensions.height * dpr;
    canvas.style.width = `${chartDimensions.width}px`;
    canvas.style.height = `${chartDimensions.height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, chartDimensions.width, chartDimensions.height);

    // Force data for testing - create mock data if none exists
    let dataToRender = priceData;
    if (!dataToRender || dataToRender.length === 0) {
      console.log("🧪 No data found, creating mock data");
      dataToRender = [
        { timestamp: Date.now() - 10000, price: 180.25 },
        { timestamp: Date.now() - 8000, price: 181.50 },
        { timestamp: Date.now() - 6000, price: 179.75 },
        { timestamp: Date.now() - 4000, price: 182.00 },
        { timestamp: Date.now() - 2000, price: 183.25 },
        { timestamp: Date.now(), price: 184.50 },
      ];
    }

    console.log("✅ Rendering with data:", dataToRender.length, "points");

    // Draw background for debugging
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fillRect(0, 0, chartDimensions.width, chartDimensions.height);

    // Calculate price range
    const prices = dataToRender.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1 || 1;
    const minPrice = min - padding;
    const maxPrice = max + padding;

    console.log("💰 Price range:", { min, max, minPrice, maxPrice });

    // Draw line with thicker stroke and brighter color
    ctx.strokeStyle = "#00FF00"; // Bright green for visibility
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Draw the price line
    ctx.beginPath();

    const pointSpacing = chartDimensions.width / Math.max(1, dataToRender.length - 1);
    
    dataToRender.forEach((data, i) => {
      const x = i * pointSpacing;
      const normalizedY = (data.price - minPrice) / (maxPrice - minPrice);
      const y = chartDimensions.height - (normalizedY * chartDimensions.height * 0.8) - 20;

      console.log(`Point ${i}:`, { x, y, price: data.price });

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw points for each data point
    ctx.fillStyle = "#00FF00";
    dataToRender.forEach((data, i) => {
      const x = i * pointSpacing;
      const normalizedY = (data.price - minPrice) / (maxPrice - minPrice);
      const y = chartDimensions.height - (normalizedY * chartDimensions.height * 0.8) - 20;

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw last point bigger
    if (dataToRender.length > 0) {
      const lastData = dataToRender[dataToRender.length - 1];
      const lastX = (dataToRender.length - 1) * pointSpacing;
      const lastNormalizedY = (lastData.price - minPrice) / (maxPrice - minPrice);
      const lastY = chartDimensions.height - (lastNormalizedY * chartDimensions.height * 0.8) - 20;

      // Outer glow
      ctx.fillStyle = "rgba(0, 255, 0, 0.3)";
      ctx.beginPath();
      ctx.arc(lastX, lastY, 12, 0, 2 * Math.PI);
      ctx.fill();

      // Inner point
      ctx.fillStyle = "#00FF00";
      ctx.beginPath();
      ctx.arc(lastX, lastY, 5, 0, 2 * Math.PI);
      ctx.fill();

      // Draw price text for last point
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 14px Arial";
      ctx.fillText(`$${lastData.price.toFixed(2)}`, lastX + 10, lastY);
    }

    // Draw connection status
    if (useWebSocket) {
      ctx.font = "12px Arial";
      ctx.fillStyle = isConnected ? "#13AE5C" : "#FF6B6B";
      const statusText = isConnected ? "● LIVE" : "● OFFLINE";
      ctx.fillText(statusText, chartDimensions.width - 60, 20);
    }

    // Draw debug info
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "12px Arial";
    ctx.fillText(`Data points: ${dataToRender.length}`, 10, chartDimensions.height - 10);
    
  }, [priceData, chartDimensions, useWebSocket, isConnected]);

  const handleBlockClick = useCallback((blockId: string) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId ? { ...block, isActive: !block.isActive } : block
      )
    );
  }, []);

  // Calculate price labels
  const priceLabels = React.useMemo(() => {
    if (!priceData || priceData.length === 0) return [];

    const { min, max } = getMinMaxPrice(priceData);
    const padding = (max - min) * 0.1 || 1;
    const minPrice = min - padding;
    const maxPrice = max + padding;
    const steps = 5;

    return Array.from({ length: steps + 1 }, (_, i) => {
      const price = maxPrice - (maxPrice - minPrice) * (i / steps);
      return price.toFixed(2);
    });
  }, [priceData]);

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
          <div className={styles.canvasContainer}>
            <canvas ref={canvasRef} className={styles.canvas} />
          </div>
        </div>
      </div>
    </div>
  );
};
