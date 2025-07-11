import { ChartBlock } from "../../types/index";

export const generateBlocks = (
  containerWidth: number,
  containerHeight: number,
  blocksPerRow: number,
  blocksPerColumn: number
): ChartBlock[] => {
  const blocks: ChartBlock[] = [];
  const gap = 2;

  // Calculate block sizes
  const blockWidth = (containerWidth - (blocksPerRow + 1) * gap) / blocksPerRow;
  const blockHeight =
    (containerHeight - (blocksPerColumn + 1) * gap) / blocksPerColumn;

  // Adjust proportions: height is greater than width
  const aspectRatio = 1.5;
  const adjustedBlockHeight = blockWidth * aspectRatio;

  // Generate blocks
  for (let row = 0; row < blocksPerColumn; row++) {
    for (let col = 0; col < blocksPerRow; col++) {
      const id = `block-${row}-${col}`;
      const x = col * (blockWidth + gap) + gap;
      const y = row * (adjustedBlockHeight + gap) + gap;

      // Random status assignment for demonstration
      const randomStatus =
        Math.random() < 0.3
          ? Math.random() < 0.5
            ? "loading"
            : "canPlusBet"
          : undefined;

      blocks.push({
        id,
        x,
        y,
        width: blockWidth,
        height: adjustedBlockHeight,
        isActive: false,
        row,
        col,
        status: randomStatus,
      });
    }
  }

  return blocks;
};

// Alternative function for generating blocks without binding to container size
// Blocks will be scaled in the component
export const generateBlocksGrid = (
  blocksPerRow: number,
  blocksPerColumn: number
): ChartBlock[] => {
  const blocks: ChartBlock[] = [];

  for (let row = 0; row < blocksPerColumn; row++) {
    for (let col = 0; col < blocksPerRow; col++) {
      const id = `block-${row}-${col}`;

      // Random status assignment for demonstration
      const randomStatus =
        Math.random() < 0.3
          ? Math.random() < 0.5
            ? "loading"
            : "canPlusBet"
          : undefined;

      blocks.push({
        id,
        x: 0, // Will be recalculated in the component
        y: 0, // Will be recalculated in the component
        width: 0, // Will be recalculated in the component
        height: 0, // Will be recalculated in the component
        isActive: false,
        row,
        col,
        bananas: Math.floor(Math.random() * 6) + 1, // 1-6 бананов
        potValue: `POT: $${Math.floor(Math.random() * 100) + 10}`,
        mainText: `${(Math.random() * 3 + 0.5).toFixed(1)}x`,
        subText: `$${Math.floor(Math.random() * 10000) + 1000}`,
        status: randomStatus,
      });
    }
  }

  return blocks;
};

// Utility function to update block status
export const updateBlockStatus = (
  blocks: ChartBlock[],
  blockId: string,
  status: "loading" | "canPlusBet" | undefined
): ChartBlock[] => {
  return blocks.map((block) =>
    block.id === blockId ? { ...block, status } : block
  );
};

// Utility function to get blocks by status
export const getBlocksByStatus = (
  blocks: ChartBlock[],
  status: "loading" | "canPlusBet"
): ChartBlock[] => {
  return blocks.filter((block) => block.status === status);
};

// Utility function to check if block has specific status
export const hasStatus = (
  block: ChartBlock,
  status: "loading" | "canPlusBet"
): boolean => {
  return block.status === status;
};

// Utility function to clear all statuses
export const clearAllStatuses = (blocks: ChartBlock[]): ChartBlock[] => {
  return blocks.map((block) => ({ ...block, status: undefined }));
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
