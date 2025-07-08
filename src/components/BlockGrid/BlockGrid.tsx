import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChartBlock } from "../../types";
import styles from "./BlockGrid.module.scss";

interface BlockGridProps {
  blocks: ChartBlock[];
  onBlockClick: (blockId: string) => void;
  className?: string;
  blocksPerRow?: number;
  blocksPerColumn?: number;
}

export const BlockGrid: React.FC<BlockGridProps> = ({
  blocks,
  onBlockClick,
  className = "",
  blocksPerRow = 10,
  blocksPerColumn = 8,
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

  // Обновляем размеры контейнера
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setContainerDimensions({ width: clientWidth, height: clientHeight });
      }
    };

    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
      updateDimensions();
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Масштабируем блоки под размер контейнера
  useEffect(() => {
    if (
      !containerDimensions.width ||
      !containerDimensions.height ||
      !blocks.length
    ) {
      setScaledBlocks(blocks);
      return;
    }

    const gap = 2;
    const blockWidth =
      (containerDimensions.width - (blocksPerRow + 1) * gap) / blocksPerRow;
    const blockHeight =
      (containerDimensions.height - (blocksPerColumn + 1) * gap) /
      blocksPerColumn;

    const newScaledBlocks = blocks.map((block, index) => {
      const col = index % blocksPerRow;
      const row = Math.floor(index / blocksPerRow);

      return {
        ...block,
        x: col * (blockWidth + gap) + gap,
        y: row * (blockHeight + gap) + gap,
        width: blockWidth,
        height: blockHeight,
      };
    });

    setScaledBlocks(newScaledBlocks);
  }, [blocks, containerDimensions, blocksPerRow, blocksPerColumn]);

  return (
    <div ref={containerRef} className={`${styles.blockGrid} ${className}`}>
      {scaledBlocks.map((block) => (
        <div
          key={block.id}
          className={`${styles.block} ${block.isActive ? styles.active : ""}`}
          style={{
            left: block.x,
            top: block.y,
            width: block.width,
            height: block.height,
          }}
          onClick={() => handleBlockClick(block.id)}
        />
      ))}
    </div>
  );
};
