import React, { useRef, useEffect } from "react";
import { PriceData, GridCell, GridConfig } from "@/types";
import { getMinMaxPrice } from "../../../../libs/utils/chartUtils";
import styles from "./Line.module.scss";

interface LineProps {
  priceData: PriceData[];
  chartDimensions: { width: number; height: number };
  isConnected: boolean;
  gridCells: GridCell[];
  gridConfig: GridConfig;
  stopAtBlock: number;
}

export const Line: React.FC<LineProps> = ({
  priceData,
  chartDimensions,
  isConnected,
  gridCells,
  gridConfig,
  stopAtBlock,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx || gridCells.length === 0) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    canvas.width = chartDimensions.width * dpr;
    canvas.height = chartDimensions.height * dpr;
    canvas.style.width = `${chartDimensions.width}px`;
    canvas.style.height = `${chartDimensions.height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, chartDimensions.width, chartDimensions.height);

    if (priceData.length > 1) {
      const { min, max } = getMinMaxPrice(priceData);
      const padding = (max - min) * 0.1 || 1;
      const minPrice = min - padding;
      const maxPrice = max + padding;

      const stopAtCellIndex = stopAtBlock - 1;
      const stopCell = gridCells[stopAtCellIndex];
      const stopPosition = stopCell ? stopCell.centerX : 0;

      const maxPointsBeforeStop = Math.min(
        stopAtCellIndex + 1,
        priceData.length
      );
      const dataToShow = priceData.slice(-maxPointsBeforeStop);

      const gradient = ctx.createLinearGradient(0, 0, stopPosition, 0);
      gradient.addColorStop(0.0, "#FAE279");
      gradient.addColorStop(0.1, "#E9BD49");
      gradient.addColorStop(0.2, "#FCE57C");
      gradient.addColorStop(0.3, "#FAE279");
      gradient.addColorStop(0.4, "#FBEBB0");
      gradient.addColorStop(0.5, "#E9BD49");
      gradient.addColorStop(0.6, "#FCE57C");
      gradient.addColorStop(0.7, "#FAE279");
      gradient.addColorStop(0.8, "#FBEBB0");
      gradient.addColorStop(0.9, "#E9BD49");
      gradient.addColorStop(1.0, "#FCE57C");

      const lineWidth = Math.max(1.5, gridConfig.cellWidth * 0.08);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();

      let lastX = 0;
      let lastY = 0;

      dataToShow.forEach((data, i) => {
        let cellIndex: number;

        if (priceData.length > stopAtCellIndex + 1) {
          cellIndex = stopAtCellIndex - (dataToShow.length - 1 - i);
        } else {
          cellIndex = i;
        }

        if (cellIndex < 0 || cellIndex >= gridCells.length) return;

        const cell = gridCells[cellIndex];
        const x = cell.centerX;

        const normalizedY = (data.price - minPrice) / (maxPrice - minPrice);
        const y =
          chartDimensions.height -
          normalizedY * chartDimensions.height * 0.8 -
          20;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        lastX = x;
        lastY = y;
      });

      ctx.stroke();

      const pointRadius = Math.max(2, gridConfig.cellWidth * 0.1);
      const pointOuterRadius = Math.max(6, gridConfig.cellWidth * 0.2);

      ctx.fillStyle = "rgba(252, 229, 124, 0.3)";
      ctx.beginPath();
      ctx.arc(lastX, lastY, pointOuterRadius, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = "#FCE57C";
      ctx.beginPath();
      ctx.arc(lastX, lastY, pointRadius, 0, 2 * Math.PI);
      ctx.fill();

      const lastData = dataToShow[dataToShow.length - 1];
      ctx.fillStyle = "#FFFFFF";
      const fontSize = Math.max(8, gridConfig.cellWidth * 0.25);
      ctx.font = `bold ${fontSize}px Arial`;
      const priceText = `${lastData.price.toFixed(2)}`;
      const textWidth = ctx.measureText(priceText).width;

      const textX =
        lastX + textWidth + 15 > chartDimensions.width
          ? lastX - textWidth - 10
          : lastX + 10;

      ctx.fillText(priceText, textX, lastY);

      if (priceData.length > stopAtCellIndex + 1) {
        ctx.strokeStyle = "rgba(252, 229, 124, 0.15)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(stopPosition, 0);
        ctx.lineTo(stopPosition, chartDimensions.height);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    } else if (isConnected) {
      ctx.fillStyle = "#FF6B6B";
      ctx.fillRect(10, 10, 140, 50);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "12px Arial";
      ctx.fillText("Waiting for data...", 20, 30);
      ctx.fillText("Connected & Ready", 20, 45);
    } else {
      ctx.fillStyle = "#FF0000";
      ctx.fillRect(10, 10, 120, 50);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "12px Arial";
      ctx.fillText("Not connected", 20, 30);
      ctx.fillText(`Status: ${isConnected}`, 20, 45);
    }

    ctx.font = "12px Arial";
    ctx.fillStyle = isConnected ? "#FCE57C" : "#FF0000";
    const statusText = isConnected ? "● LIVE" : "● OFFLINE";
    ctx.fillText(statusText, chartDimensions.width - 60, 20);
  }, [
    priceData,
    chartDimensions,
    isConnected,
    gridCells,
    gridConfig,
    stopAtBlock,
  ]);

  return <canvas ref={canvasRef} className={styles.canvas} />;
};
