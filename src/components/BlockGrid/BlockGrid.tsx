import React, { useCallback } from 'react';
import { ChartBlock } from '../../types';
import styles from './BlockGrid.module.scss';

interface BlockGridProps {
  blocks: ChartBlock[];
  onBlockClick: (blockId: string) => void;
  className?: string;
}

export const BlockGrid: React.FC<BlockGridProps> = ({
  blocks,
  onBlockClick,
  className = ''
}) => {
  const handleBlockClick = useCallback((blockId: string) => {
    onBlockClick(blockId);
  }, [onBlockClick]);

  return (
    <div className={`${styles.blockGrid} ${className}`}>
      {blocks.map((block) => (
        <div
          key={block.id}
          className={`${styles.block} ${block.isActive ? styles.active : ''}`}
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
