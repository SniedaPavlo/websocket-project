import React, { useCallback } from "react";
import { ChartBlock } from "@/types";
import styles from "./Block.module.scss";
import { BananaIcon } from "../../../Icons/Banana";

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
        <div className={styles.headerWrapper}>
          <span className={styles.topLeft}>
            {/* bananas */}
            <div className={styles.bananas}>
              <BananaIcon />
              <BananaIcon />
              <BananaIcon />
              <BananaIcon />
              <BananaIcon />
              <BananaIcon />
            </div>
          </span>
          <span className={styles.topRight}>POT: $25</span>
        </div>

        <div className={styles.textWrapper}>
          <div className={styles.mainText}>1.3x</div>
          <div className={styles.subText}>$4,110</div>
        </div>
      </div>
    </div>
  );
};
