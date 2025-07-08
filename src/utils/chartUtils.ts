// import { PriceData, ChartBlock } from "../types";

// export const generateBlocks = (
//   containerWidth: number,
//   containerHeight: number,
//   blocksPerRow: number,
//   blocksPerColumn: number
// ): ChartBlock[] => {
//   const blocks: ChartBlock[] = [];

//   // Calculate block size to fit perfectly within container
//   const blockWidth = containerWidth / blocksPerRow;
//   const blockHeight = (containerHeight / blocksPerColumn) * 2;

//   for (let row = 0; row < blocksPerColumn; row++) {
//     for (let col = 0; col < blocksPerRow; col++) {
//       blocks.push({
//         id: `block-${row}-${col}`,
//         x: col * blockWidth,
//         y: row * blockHeight,
//         width: blockWidth,
//         height: blockHeight,
//         isActive: false,
//         onClick: () => console.log(`Block ${row}-${col} clicked`),
//       });
//     }
//   }

//   return blocks;
// };

// export const normalizePrice = (
//   price: number,
//   minPrice: number,
//   maxPrice: number,
//   chartHeight: number
// ): number => {
//   const range = maxPrice - minPrice;
//   if (range === 0) return chartHeight / 2;
//   return chartHeight - ((price - minPrice) / range) * chartHeight;
// };

// export const formatPrice = (price: number): string => {
//   return `$${price.toFixed(2)}`;
// };

// export const formatTime = (timestamp: number): string => {
//   return new Date(timestamp * 1000).toLocaleTimeString("en-US", {
//     hour12: false,
//     hour: "2-digit",
//     minute: "2-digit",
//     second: "2-digit",
//   });
// };

// export const getMinMaxPrice = (
//   data: PriceData[]
// ): { min: number; max: number } => {
//   if (data.length === 0) return { min: 0, max: 100 };

//   const prices = data.map((d) => d.price);
//   return {
//     min: Math.min(...prices),
//     max: Math.max(...prices),
//   };
// };

import { ChartBlock } from "../types";

export const generateBlocks = (
  containerWidth: number,
  containerHeight: number,
  blocksPerRow: number,
  blocksPerColumn: number
): ChartBlock[] => {
  const blocks: ChartBlock[] = [];
  const gap = 2;

  // Рассчитываем размеры блоков
  const blockWidth = (containerWidth - (blocksPerRow + 1) * gap) / blocksPerRow;
  const blockHeight =
    (containerHeight - (blocksPerColumn + 1) * gap) / blocksPerColumn;

  // Генерируем блоки
  for (let row = 0; row < blocksPerColumn; row++) {
    for (let col = 0; col < blocksPerRow; col++) {
      const id = `block-${row}-${col}`;
      const x = col * (blockWidth + gap) + gap;
      const y = row * (blockHeight + gap) + gap;

      blocks.push({
        id,
        x,
        y,
        width: blockWidth,
        height: blockHeight,
        isActive: false,
        // @ts-ignore
        row,
        col,
      });
    }
  }

  return blocks;
};

// Альтернативная функция для генерации блоков без привязки к размеру контейнера
// Блоки будут масштабироваться в компоненте
export const generateBlocksGrid = (
  blocksPerRow: number,
  blocksPerColumn: number
): ChartBlock[] => {
  const blocks: ChartBlock[] = [];

  for (let row = 0; row < blocksPerColumn; row++) {
    for (let col = 0; col < blocksPerRow; col++) {
      const id = `block-${row}-${col}`;

      blocks.push({
        id,
        x: 0, // Будет пересчитано в компоненте
        y: 0, // Будет пересчитано в компоненте
        width: 0, // Будет пересчитано в компоненте
        height: 0, // Будет пересчитано в компоненте
        isActive: false,
        // @ts-ignore
        row,
        col,
      });
    }
  }

  return blocks;
};

export const normalizePrice = (
  price: number,
  minPrice: number,
  maxPrice: number,
  canvasHeight: number
): number => {
  const normalized = (price - minPrice) / (maxPrice - minPrice);
  return canvasHeight - normalized * canvasHeight;
};

export const getMinMaxPrice = (
  priceData: Array<{ price: number }>
): { min: number; max: number } => {
  if (priceData.length === 0) return { min: 0, max: 0 };

  const prices = priceData.map((data) => data.price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
};

export const formatPrice = (price: number): string => {
  return `$${price.toFixed(2)}`;
};
