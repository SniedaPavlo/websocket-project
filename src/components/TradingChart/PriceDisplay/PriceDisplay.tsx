import React from "react";
import { formatPrice } from "../../../libs/utils/chartUtils";
import styles from "./PriceDisplay.module.scss";

interface PriceDisplayProps {
  price: number;
  isConnected: boolean;
  className?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  isConnected,
  className = "",
}) => {
  return (
    <div className={`${styles.priceDisplay} ${className}`}>
      <div className={styles.priceValue}>{formatPrice(price)}</div>
      <div
        className={`${styles.status} ${
          isConnected ? styles.connected : styles.disconnected
        }`}
      >
        <div className={styles.indicator} />
        {isConnected ? "Connected" : "Disconnected"}
      </div>
    </div>
  );
};
