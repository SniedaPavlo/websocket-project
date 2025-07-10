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
            {block.bananas && block.bananas > 0 && (
              <div className={styles.bananas}>
                {Array.from({ length: block.bananas }, (_, index) => (
                  <BananaIcon key={index} />
                ))}
              </div>
            )}
          </span>
          {block.potValue && (
            <span className={styles.topRight}>{block.potValue}</span>
          )}
        </div>

        <div className={styles.textWrapper}>
          {block.mainText && (
            <div className={styles.mainText}>{block.mainText}</div>
          )}
          {block.subText && (
            <div className={styles.subText}>{block.subText}</div>
          )}
        </div>
      </div>
    </div>
  );
};
