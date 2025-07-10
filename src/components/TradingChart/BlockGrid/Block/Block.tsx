import React, { useCallback } from "react";
import { ChartBlock } from "../../../../types";
import styles from "./Block.module.scss";

interface BlockProps {
  block: ChartBlock;
  onClick: (blockId: string) => void;
}

export const Block: React.FC<BlockProps> = ({ block, onClick }) => {
  const handleClick = useCallback(() => {
    onClick(block.id);
  }, [block.id, onClick]);

  return (
    <div
      className={`${styles.block} ${block.isActive ? styles.active : ""}`}
      style={{
        left: `${block.x}px`,
        top: `${block.y}px`,
        width: `${block.width}px`,
        height: `${block.height}px`,
      }}
      onClick={handleClick}
    >
      <div className={styles.content}>
        <div className={styles.mainText}>1.3x</div>
        <div className={styles.subText}>$4,110</div>
      </div>
    </div>
  );
};
