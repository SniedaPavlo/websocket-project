import { PriceData, ChartBlock } from '../types';

export const generateBlocks = (
  containerWidth: number,
  containerHeight: number,
  blocksPerRow: number,
  blocksPerColumn: number
): ChartBlock[] => {
  const blocks: ChartBlock[] = [];
  
  // Calculate block size to fit perfectly within container
  const blockWidth = containerWidth / blocksPerRow;
  const blockHeight = containerHeight / blocksPerColumn;

  for (let row = 0; row < blocksPerColumn; row++) {
    for (let col = 0; col < blocksPerRow; col++) {
      blocks.push({
        id: `block-${row}-${col}`,
        x: col * blockWidth,
        y: row * blockHeight,
        width: blockWidth,
        height: blockHeight,
        isActive: false,
        onClick: () => console.log(`Block ${row}-${col} clicked`)
      });
    }
  }

  return blocks;
};

export const normalizePrice = (
  price: number,
  minPrice: number,
  maxPrice: number,
  chartHeight: number
): number => {
  const range = maxPrice - minPrice;
  if (range === 0) return chartHeight / 2;
  return chartHeight - ((price - minPrice) / range) * chartHeight;
};

export const formatPrice = (price: number): string => {
  return `$${price.toFixed(2)}`;
};

export const formatTime = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export const getMinMaxPrice = (data: PriceData[]): { min: number; max: number } => {
  if (data.length === 0) return { min: 0, max: 100 };
  
  const prices = data.map(d => d.price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  };
};
