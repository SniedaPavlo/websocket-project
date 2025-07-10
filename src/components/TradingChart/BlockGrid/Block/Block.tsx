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
    // Only allow click if not in loading state
    if (block.status !== "loading") {
      onClick(block.id);
    }
  };

  // Determine if we should show status content instead of regular content
  const showStatusContent =
    block.status === "loading" || block.status === "canPlusBet";

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
        {/* Show status content if status is set */}
        {showStatusContent ? (
          <div className={styles.statusContent}>
            {block.status === "loading" && (
              // Simple loading spinner
              <LoadingIcon />
            )}
            {block.status === "canPlusBet" && (
              // Plus button
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent block click
                  // Handle plus button click here
                  console.log("Plus button clicked for block:", block.id);
                }}
                aria-label="Add bet"
              >
                <PlusIcon />
              </button>
            )}
          </div>
        ) : (
          // Show regular content when no status
          <>
            <div className={styles.headerWrapper}>
              <div className={styles.topLeft}>
                {block.bananas && (
                  <div className={styles.bananas}>
                    {Array.from({ length: Math.min(block.bananas, 6) }).map(
                      (_, i) => (
                        <BananaIcon key={i} />
                      )
                    )}
                  </div>
                )}
              </div>
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
