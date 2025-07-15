import React from "react";
import styles from "./Block.module.scss";
import { ChartBlock } from "../../../../types";

import { BananaIcon } from "../../../Icons/Banana";

interface BlockProps {
  block: ChartBlock;
  onClick: (blockId: string) => void;
  size: number;
}

export const Block: React.FC<BlockProps> = ({ block, onClick, size }) => {
  const handleClick = () => {
    onClick(block.id);
  };

  const renderBananas = () => {
    if (!block.bananas || block.bananas === 0) return null;

    if (block.bananas <= 3) {
      return (
        <div className={styles.bananas}>
          {Array.from({ length: block.bananas }).map((_, i) => (
            <BananaIcon key={i} />
          ))}
        </div>
      );
    } else {
      return (
        <div className={styles.bananasWithMultiplier}>
          <BananaIcon />
          <span className={styles.multiplier}>x{block.bananas}</span>
        </div>
      );
    }
  };

  return (
    <div
      className={`${styles.block} ${block.isActive ? styles.active : ""}`}
      onClick={handleClick}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      <div className={styles.content}>
        <div className={styles.topLeft}>{renderBananas()}</div>

        <div className={styles.textWrapper}>
          {block.mainText && <p className={styles.mainText}>BET</p>}
          {block.subText && <p className={styles.subText}>{block.subText}</p>}
        </div>
      </div>
    </div>
  );
};
