import React, { useCallback } from "react";
import { ChartBlock } from "../../../../types";
import styles from "./Block.module.scss";

interface BlockProps {
  block: ChartBlock;
  onClick: (blockId: string) => void;
  size?: number;
}

export const Block: React.FC<BlockProps> = ({ block, onClick, size }) => {
  const handleClick = useCallback(() => {
    onClick(block.id);
  }, [block.id, onClick]);

  return (
    <div
      className={`${styles.block} ${block.isActive ? styles.active : ""}`}
      style={{
        width: size ? `${size}px` : undefined,
        height: size ? `${size}px` : undefined,
      }}
      onClick={handleClick}
    >
      <div className={styles.content}>
        <div className={styles.textWrapper}>
          <div className={styles.mainText}>1.3x</div>
          <div className={styles.subText}>$4,110</div>
        </div>
      </div>
    </div>
  );
};
