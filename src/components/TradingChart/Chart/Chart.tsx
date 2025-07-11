import React, { useRef, useEffect, useState, useCallback } from "react";
import { PriceData, ChartBlock } from "@/types";
import { BlockGrid } from "../BlockGrid";
import { generateBlocksGrid, getMinMaxPrice } from "../../../libs/utils/chartUtils";
import { useResponsive } from "../../../hooks/useResponsive";
import { useWebSocketPrice } from "../../../hooks/useWebSocketPrice";
import styles from "./Chart.module.scss";

interface ChartProps {
  priceData?: PriceData[];
  feed?: string;
  useWebSocket?: boolean;
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
  const { priceData: webSocketPriceData, isConnected } = useWebSocketPrice({
    feed,
    maxDataPoints: 100,
  });

  const priceData = externalPriceData?.length ? externalPriceData : webSocketPriceData || [];

  useEffect(() => {
    setBlocks(generateBlocksGrid(blockConfig.blocksPerRow, blockConfig.blocksPerColumn));
  }, [blockConfig.blocksPerRow, blockConfig.blocksPerColumn]);

  useEffect(() => {
    const updateDimensions = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = rect.width || width;
      const newHeight = rect.height || height;

      if (newWidth > 0 && newHeight > 0) {
        setChartDimensions({ width: newWidth, height: newHeight });
      }
    };

    updateDimensions();
    
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener("resize", updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDimensions);
    };
  }, [width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx || chartDimensions.width === 0 || chartDimensions.height === 0) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    canvas.width = chartDimensions.width * dpr;
    canvas.height = chartDimensions.height * dpr;
    canvas.style.width = `${chartDimensions.width}px`;
    canvas.style.height = `${chartDimensions.height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, chartDimensions.width, chartDimensions.height);

    let dataToRender = priceData;
    if (!dataToRender?.length) {
      dataToRender = [
        { timestamp: Date.now() - 10000, price: 180.25 },
        { timestamp: Date.now() - 8000, price: 181.50 },
        { timestamp: Date.now() - 6000, price: 179.75 },
        { timestamp: Date.now() - 4000, price: 182.00 },
        { timestamp: Date.now() - 2000, price: 183.25 },
        { timestamp: Date.now(), price: 184.50 },
      ];
    }

    const prices = dataToRender.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1 || 1;
    const minPrice = min - padding;
    const maxPrice = max + padding;

    ctx.strokeStyle = "#00FF00";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    const pointSpacing = chartDimensions.width / Math.max(1, dataToRender.length - 1);
    
    dataToRender.forEach((data, i) => {
      const x = i * pointSpacing;
      const normalizedY = (data.price - minPrice) / (maxPrice - minPrice);
      const y = chartDimensions.height - (normalizedY * chartDimensions.height * 0.8) - 20;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    ctx.fillStyle = "#00FF00";
    dataToRender.forEach((data, i) => {
      const x = i * pointSpacing;
      const normalizedY = (data.price - minPrice) / (maxPrice - minPrice);
      const y = chartDimensions.height - (normalizedY * chartDimensions.height * 0.8) - 20;

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });

    if (dataToRender.length > 0) {
      const lastData = dataToRender[dataToRender.length - 1];
      const lastX = (dataToRender.length - 1) * pointSpacing;
      const lastNormalizedY = (lastData.price - minPrice) / (maxPrice - minPrice);
      const lastY = chartDimensions.height - (lastNormalizedY * chartDimensions.height * 0.8) - 20;

      ctx.fillStyle = "rgba(0, 255, 0, 0.3)";
      ctx.beginPath();
      ctx.arc(lastX, lastY, 12, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = "#00FF00";
      ctx.beginPath();
      ctx.arc(lastX, lastY, 5, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 14px Arial";
      ctx.fillText(`$${lastData.price.toFixed(2)}`, lastX + 10, lastY);
    }

    if (useWebSocket) {
      ctx.font = "12px Arial";
      ctx.fillStyle = isConnected ? "#13AE5C" : "#FF6B6B";
      const statusText = isConnected ? "● LIVE" : "● OFFLINE";
      ctx.fillText(statusText, chartDimensions.width - 60, 20);
    }
  }, [priceData, chartDimensions, useWebSocket, isConnected]);

  const handleBlockClick = useCallback((blockId: string) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId ? { ...block, isActive: !block.isActive } : block
      )
    );
  }, []);

  const priceLabels = React.useMemo(() => {
    if (!priceData?.length) return [];

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
