import React from "react";
import styles from "./Block.module.scss";
import { ChartBlock } from "../../../../types";

import { BananaIcon } from "../../../Icons/Banana";
import { PlusIcon } from "../../../Icons/Plus";
import { LoadingIcon } from "../../../Icons/Loading";

interface BlockProps {
  block: ChartBlock;
  onClick: (blockId: string) => void;
  size: number;
}

export const Block: React.FC<BlockProps> = ({ block, onClick, size }) => {
  const handleClick = () => {
    if (block.status !== "loading") {
      onClick(block.id);
    }
  };

  const showStatusContent =
    block.status === "loading" || block.status === "canPlusBet";

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
      className={`${styles.block} ${block.isActive ? styles.active : ""} ${
        block.status === "loading" ? styles.loading : ""
      }`}
      onClick={handleClick}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        cursor: block.status === "loading" ? "not-allowed" : "pointer",
      }}
    >
      <div className={styles.content}>
        {showStatusContent ? (
          <div className={styles.statusContent}>
            {block.status === "loading" && <LoadingIcon />}
            {block.status === "canPlusBet" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("Plus button clicked for block:", block.id);
                }}
                aria-label="Add bet"
              >
                <PlusIcon />
              </button>
            )}
          </div>
        ) : (
          <>
            <div className={styles.headerWrapper}>
              <div className={styles.topLeft}>{renderBananas()}</div>
              {block.potValue && (
                <div className={styles.topRight}>{block.potValue}</div>
              )}
            </div>
            <div className={styles.textWrapper}>
              {block.mainText && (
                <p className={styles.mainText}>{block.mainText}</p>
              )}
              {block.subText && (
                <p className={styles.subText}>{block.subText}</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
