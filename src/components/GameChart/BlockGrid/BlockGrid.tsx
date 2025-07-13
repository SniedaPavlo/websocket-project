import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChartBlock, GridCell, GridConfig } from "../../../types";
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
  gridCells?: GridCell[];
  gridConfig?: GridConfig;
}

export const BlockGrid: React.FC<BlockGridProps> = ({
  blocks,
  onBlockClick,
  className = "",
  blocksPerRow = 10,
  blocksPerColumn = 8,
  containerWidth,
  containerHeight,
  gridCells,
  gridConfig,
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

  // Use unified grid if provided, otherwise fallback to original logic
  const useUnifiedGrid = gridCells && gridConfig && gridCells.length > 0;

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

  // Calculate block size based on container dimensions (fallback)
  useEffect(() => {
    if (useUnifiedGrid) {
      setBlockSize(gridConfig!.cellWidth);
      return;
    }

    if (!containerDimensions.width || !containerDimensions.height) {
      return;
    }

    const gap = Math.max(1, Math.min(4, containerDimensions.width / 200));
    const availableWidth = containerDimensions.width - gap * (blocksPerRow - 1);
    const availableHeight =
      containerDimensions.height - gap * (blocksPerColumn - 1);

    // Всегда используем квадратные блоки
    const maxBlockWidth = availableWidth / blocksPerRow;
    const maxBlockHeight = availableHeight / blocksPerColumn;

    // Выбираем минимальный размер для сохранения квадратной формы
    const calculatedSize = Math.min(maxBlockWidth, maxBlockHeight);

    setBlockSize(calculatedSize);
  }, [
    containerDimensions,
    blocksPerRow,
    blocksPerColumn,
    useUnifiedGrid,
    gridConfig,
  ]);

  if (useUnifiedGrid) {
    // Use unified grid positioning
    return (
      <div
        ref={containerRef}
        className={`${styles.blockGrid} ${className}`}
        style={{
          position: "relative",
          width: containerWidth ? `${containerWidth}px` : "100%",
          height: containerHeight ? `${containerHeight}px` : "100%",
        }}
      >
        {blocks.map((block, index) => {
          const cell = gridCells![index];
          if (!cell) return null;

          return (
            <div
              key={block.id}
              style={{
                position: "absolute",
                left: `${cell.x}px`,
                top: `${cell.y}px`,
                width: `${cell.width}px`,
                height: `${cell.height}px`,
              }}
            >
              <Block
                block={block}
                onClick={handleBlockClick}
                size={cell.width} // Используем квадратный размер
              />
            </div>
          );
        })}
      </div>
    );
  }

  // Fallback to original CSS Grid - тоже с центрированием
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
