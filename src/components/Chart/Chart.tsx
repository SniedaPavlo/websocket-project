import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PriceData, ChartBlock } from '../../types';
import { BlockGrid } from '../BlockGrid';
import { generateBlocks, normalizePrice, getMinMaxPrice } from '../../utils/chartUtils';
import { useResponsive } from '../../hooks/useResponsive';
import styles from './Chart.module.scss';

interface ChartProps {
  priceData: PriceData[];
  width?: number;
  height?: number;
  className?: string;
  isHistoryLoaded?: boolean;
}

export const Chart: React.FC<ChartProps> = ({
  priceData,
  width = 800,
  height = 400,
  className = '',
  isHistoryLoaded = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [blocks, setBlocks] = useState<ChartBlock[]>([]);
  const [chartDimensions, setChartDimensions] = useState({ width, height });
  const { blockConfig } = useResponsive();

  // Initialize blocks
  useEffect(() => {
    const newBlocks = generateBlocks(
      chartDimensions.width,
      chartDimensions.height,
      blockConfig.blocksPerRow,
      blockConfig.blocksPerColumn
    );
    setBlocks(newBlocks);
  }, [chartDimensions.width, chartDimensions.height, blockConfig.blocksPerRow, blockConfig.blocksPerColumn]);

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setChartDimensions({ width: clientWidth, height: clientHeight });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
      handleResize();
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Draw chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    console.log('Drawing chart with data points:', priceData.length);
    if (priceData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = chartDimensions.width;
    canvas.height = chartDimensions.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get price range
    const { min, max } = getMinMaxPrice(priceData);
    const padding = (max - min) * 0.1; // 10% padding
    const minPrice = min - padding;
    const maxPrice = max + padding;


    // Draw price line
    ctx.strokeStyle = '#13AE5C';
    ctx.lineWidth = 2;
    ctx.beginPath();

    // Calculate chart positioning
    const totalBlocks = blockConfig.blocksPerRow;
    const blockWidth = canvas.width / totalBlocks;
    
    // Position chart to end 3 blocks from the right
    const endOffset = 3 * blockWidth;
    const chartEndX = canvas.width - endOffset;
    
    // Calculate how many data points can fit
    const pointSpacing = 2; // pixels between points
    const maxVisiblePoints = Math.floor(chartEndX / pointSpacing);
    
    // Determine which data to show
    let dataToShow = priceData;
    let startOffset = 0;
    
    if (isHistoryLoaded && priceData.length > maxVisiblePoints) {
      // Show last maxVisiblePoints, shifting left as new data comes
      dataToShow = priceData.slice(-maxVisiblePoints);
      startOffset = 0;
    } else if (!isHistoryLoaded) {
      // During history loading, start from left
      dataToShow = priceData.slice(0, maxVisiblePoints);
      startOffset = 0;
    }
    
    // Draw price line
    for (let i = 0; i < dataToShow.length; i++) {
      const x = startOffset + (i * pointSpacing);
      const y = normalizePrice(dataToShow[i].price, minPrice, maxPrice, canvas.height);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    // Draw current price point
    if (dataToShow.length > 0) {
      const lastIndex = dataToShow.length - 1;
      const currentPrice = dataToShow[lastIndex];
      const x = startOffset + (lastIndex * pointSpacing);
      const y = normalizePrice(currentPrice.price, minPrice, maxPrice, canvas.height);

      ctx.fillStyle = '#13AE5C';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  }, [priceData, chartDimensions, isHistoryLoaded, blockConfig]);

  const handleBlockClick = useCallback((blockId: string) => {
    setBlocks(prev => 
      prev.map(block => 
        block.id === blockId 
          ? { ...block, isActive: !block.isActive }
          : block
      )
    );
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`${styles.chart} ${className}`}
      style={{ width, height }}
    >
      <div className={styles.chartWrapper}>
        <div className={styles.priceLabels}>
          {priceData.length > 0 && (() => {
            const { min, max } = getMinMaxPrice(priceData);
            const padding = (max - min) * 0.1;
            const minPrice = min - padding;
            const maxPrice = max + padding;
            const priceSteps = 5;
            return Array.from({ length: priceSteps + 1 }, (_, i) => {
              const price = maxPrice - (maxPrice - minPrice) * (i / priceSteps);
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
          />
          <canvas 
            ref={canvasRef}
            className={styles.canvas}
          />
        </div>
      </div>
    </div>
  );
};
