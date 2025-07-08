import React, { useRef, useEffect, useState, useCallback } from "react";
import { PriceData, ChartBlock } from "../../types";
import { BlockGrid } from "../BlockGrid";
import {
  generateBlocksGrid,
  normalizePrice,
  getMinMaxPrice,
} from "../../utils/chartUtils";
import { useResponsive } from "../../hooks/useResponsive";
import styles from "./Chart.module.scss";

interface ChartProps {
  priceData: PriceData[];
  width?: number;
  height?: number;
  className?: string;
}

export const Chart: React.FC<ChartProps> = ({
  priceData,
  width = 800,
  height = 400,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [blocks, setBlocks] = useState<ChartBlock[]>([]);
  const [chartDimensions, setChartDimensions] = useState({ width, height });
  const { blockConfig } = useResponsive();

  // Инициализация блоков (Initialize blocks)
  useEffect(() => {
    const newBlocks = generateBlocksGrid(
      blockConfig.blocksPerRow,
      blockConfig.blocksPerColumn
    );
    setBlocks(newBlocks);
  }, [blockConfig.blocksPerRow, blockConfig.blocksPerColumn]);

  // Обработка изменения размера контейнера с debounce (Handle container resize with debounce)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;

        // Make sure the sizes are not zero
        if (clientWidth > 0 && clientHeight > 0) {
          setChartDimensions({
            width: clientWidth,
            height: clientHeight,
          });
        }
      }
    };

    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 16); // ~60fps
    };

    const resizeObserver = new ResizeObserver(debouncedResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
      handleResize(); // Initial size
    }

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timeoutId);
    };
  }, []);

  // Логика отрисовки на canvas (Canvas drawing logic)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !priceData.length || chartDimensions.width === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Устанавливаем размер canvas с учетом device pixel ratio для четкости (Set canvas size with device pixel ratio for crisp rendering)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = chartDimensions.width * dpr;
    canvas.height = chartDimensions.height * dpr;
    canvas.style.width = `${chartDimensions.width}px`;
    canvas.style.height = `${chartDimensions.height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, chartDimensions.width, chartDimensions.height);

    const { min, max } = getMinMaxPrice(priceData);
    const padding = (max - min) * 0.1;
    const minPrice = min - padding;
    const maxPrice = max + padding;

    const blockWidth = chartDimensions.width / blockConfig.blocksPerRow;
    const pointSpacing = Math.max(1, blockWidth * 0.25); // Adaptive spacing
    const progress = Math.min(priceData.length / 100, 1);
    const endOffset = 5 * blockWidth - 2 * blockWidth * progress;
    const chartEndX = chartDimensions.width - endOffset;
    const startOffset =
      priceData.length > 0
        ? chartEndX - (priceData.length - 1) * pointSpacing
        : chartEndX;

    // Адаптивная толщина линии в зависимости от размера контейнера (Adaptive line width based on container size)
    const lineWidth = Math.max(1, Math.min(3, chartDimensions.width / 400));

    ctx.strokeStyle = "#13AE5C";
    ctx.lineWidth = lineWidth;
    ctx.beginPath();

    priceData.forEach((data, i) => {
      const x = startOffset + i * pointSpacing;
      const y = normalizePrice(
        data.price,
        minPrice,
        maxPrice,
        chartDimensions.height
      );
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });

    ctx.stroke();

    // Рисуем последнюю точку (Draw last point)
    if (priceData.length > 0) {
      const lastData = priceData[priceData.length - 1];
      const x = startOffset + (priceData.length - 1) * pointSpacing;
      const y = normalizePrice(
        lastData.price,
        minPrice,
        maxPrice,
        chartDimensions.height
      );

      const pointRadius = Math.max(2, Math.min(6, chartDimensions.width / 200));

      ctx.fillStyle = "#13AE5C";
      ctx.beginPath();
      ctx.arc(x, y, pointRadius, 0, 2 * Math.PI);
      ctx.fill();
    }
  }, [priceData, chartDimensions, blockConfig]);

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
        minWidth: "200px",
        minHeight: "200px",
      }}
    >
      <div className={styles.chartWrapper}>
        <div className={styles.priceLabels}>
          {priceData.length > 0 &&
            (() => {
              const { min, max } = getMinMaxPrice(priceData);
              const padding = (max - min) * 0.1;
              const minPrice = min - padding;
              const maxPrice = max + padding;
              const priceSteps = Math.min(
                5,
                Math.floor(chartDimensions.height / 60)
              );
              return Array.from({ length: priceSteps + 1 }, (_, i) => {
                const price =
                  maxPrice - (maxPrice - minPrice) * (i / priceSteps);
                return (
                  <div key={i} className={styles.priceLabel}>
                    {price.toFixed(2)}
                  </div>
                );
              });
            })()}
        </div>

        <div className={styles.chartContent}>
          <BlockGrid
            blocks={blocks}
            onBlockClick={handleBlockClick}
            className={styles.blockGrid}
            blocksPerRow={blockConfig.blocksPerRow}
            blocksPerColumn={blockConfig.blocksPerColumn}
            containerWidth={chartDimensions.width - 60} // Minus priceLabels width
            containerHeight={chartDimensions.height}
          />
          <canvas ref={canvasRef} className={styles.canvas} />
        </div>
      </div>
    </div>
  );
};
