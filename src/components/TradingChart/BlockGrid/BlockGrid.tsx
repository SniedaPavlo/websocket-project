import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChartBlock } from "../../../types";
import styles from "./BlockGrid.module.scss";

interface BlockGridProps {
  blocks: ChartBlock[];
  onBlockClick: (blockId: string) => void;
  className?: string;
  blocksPerRow?: number;
  blocksPerColumn?: number;
  containerWidth?: number;
  containerHeight?: number;
}

export const BlockGrid: React.FC<BlockGridProps> = ({
  blocks,
  onBlockClick,
  className = "",
  blocksPerRow = 10,
  blocksPerColumn = 8,
  containerWidth,
  containerHeight,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [scaledBlocks, setScaledBlocks] = useState<ChartBlock[]>([]);

  const handleBlockClick = useCallback(
    (blockId: string) => {
      onBlockClick(blockId);
    },
    [onBlockClick]
  );

  // Update container dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;

        // Use passed dimensions if available, otherwise measure container
        const width = containerWidth || clientWidth;
        const height = containerHeight || clientHeight;

        if (width > 0 && height > 0) {
          setContainerDimensions({ width, height });
        }
      }
    };

    // If dimensions are passed from outside, use them
    if (containerWidth && containerHeight) {
      setContainerDimensions({
        width: containerWidth,
        height: containerHeight,
      });
    } else {
      const resizeObserver = new ResizeObserver(updateDimensions);
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
        updateDimensions();
      }

      return () => resizeObserver.disconnect();
    }
  }, [containerWidth, containerHeight]);

  // Scale blocks to fit container size
  useEffect(() => {
    if (
      !containerDimensions.width ||
      !containerDimensions.height ||
      !blocks.length
    ) {
      setScaledBlocks(blocks);
      return;
    }

    const gap = Math.max(1, Math.min(4, containerDimensions.width / 200)); // Adaptive gap
    const aspectRatio = 1; // Height is 1 times the width (square)

    // Calculate block sizes so they fit in the container
    const availableWidth = containerDimensions.width - gap * (blocksPerRow + 1);
    const availableHeight =
      containerDimensions.height - gap * (blocksPerColumn + 1);

    // Calculate max block size by width and height
    const maxBlockWidth = availableWidth / blocksPerRow;
    const maxBlockHeight = availableHeight / blocksPerColumn;

    // Choose the smallest size so blocks fit in the container
    let blockWidth = maxBlockWidth;
    let blockHeight = blockWidth * aspectRatio;

    // If blocks don't fit by height, recalculate based on height
    if (blockHeight > maxBlockHeight) {
      blockHeight = maxBlockHeight;
      blockWidth = blockHeight / aspectRatio;
    }

    // Minimum size for clickability
    const minSize = Math.max(4, Math.min(8, containerDimensions.width / 100));
    blockWidth = Math.max(minSize, blockWidth);
    blockHeight = Math.max(minSize * aspectRatio, blockHeight);

    // Center the grid if there is free space
    const totalGridWidth = blocksPerRow * blockWidth + (blocksPerRow - 1) * gap;
    const totalGridHeight =
      blocksPerColumn * blockHeight + (blocksPerColumn - 1) * gap;

    const offsetX = Math.max(
      0,
      (containerDimensions.width - totalGridWidth) / 2
    );
    const offsetY = Math.max(
      0,
      (containerDimensions.height - totalGridHeight) / 2
    );

    const newScaledBlocks = blocks.map((block, index) => {
      const col = index % blocksPerRow;
      const row = Math.floor(index / blocksPerRow);

      return {
        ...block,
        x: offsetX + col * (blockWidth + gap),
        y: offsetY + row * (blockHeight + gap),
        width: blockWidth,
        height: blockHeight,
      };
    });

    setScaledBlocks(newScaledBlocks);
  }, [blocks, containerDimensions, blocksPerRow, blocksPerColumn]);

  return (
    <div
      ref={containerRef}
      className={`${styles.blockGrid} ${className}`}
      style={{
        width: containerWidth ? `${containerWidth}px` : "100%",
        height: containerHeight ? `${containerHeight}px` : "100%",
      }}
    >
      {scaledBlocks.map((block) => (
        <div
          key={block.id}
          className={`${styles.block} ${block.isActive ? styles.active : ""}`}
          style={{
            left: `${block.x}px`,
            top: `${block.y}px`,
            width: `${block.width}px`,
            height: `${block.height}px`,
          }}
          onClick={() => handleBlockClick(block.id)}
        />
      ))}
    </div>
  );
};
