import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChartBlock } from "../../../types";
import { Block } from "./Block/Block";
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
  const [blockSize, setBlockSize] = useState(0);

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
        const width = containerWidth || clientWidth;
        const height = containerHeight || clientHeight;

        if (width > 0 && height > 0) {
          setContainerDimensions({ width, height });
        }
      }
    };

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

  // Calculate block size based on container dimensions
  useEffect(() => {
    if (!containerDimensions.width || !containerDimensions.height) {
      return;
    }

    const gap = Math.max(1, Math.min(4, containerDimensions.width / 200));

    // Calculate available space for blocks
    const availableWidth = containerDimensions.width - gap * (blocksPerRow - 1);
    const availableHeight =
      containerDimensions.height - gap * (blocksPerColumn - 1);

    // Calculate max block size by width and height
    const maxBlockWidth = availableWidth / blocksPerRow;
    const maxBlockHeight = availableHeight / blocksPerColumn;

    // Choose the smallest size to ensure blocks fit
    const calculatedSize = Math.min(maxBlockWidth, maxBlockHeight);

    // Apply minimum size constraint
    const minSize = Math.max(4, Math.min(8, containerDimensions.width / 100));
    const finalSize = Math.max(minSize, calculatedSize);

    setBlockSize(finalSize);
  }, [containerDimensions, blocksPerRow, blocksPerColumn]);

  const gridGap = Math.max(1, Math.min(4, containerDimensions.width / 200));

  return (
    <div
      ref={containerRef}
      className={`${styles.blockGrid} ${className}`}
      style={{
        width: containerWidth ? `${containerWidth}px` : "100%",
        height: containerHeight ? `${containerHeight}px` : "100%",
        gridTemplateColumns: `repeat(${blocksPerRow}, ${blockSize}px)`,
        gridTemplateRows: `repeat(${blocksPerColumn}, ${blockSize}px)`,
        gap: `${gridGap}px`,
      }}
    >
      {blocks.map((block) => (
        <Block
          key={block.id}
          block={block}
          onClick={handleBlockClick}
          size={blockSize}
        />
      ))}
    </div>
  );
};
