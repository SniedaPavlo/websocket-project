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
  gameProgress: number;
  gameNumber: number;
  currentColumnIndex: number;
  gameStartTime: number;
}

const SECONDS_PER_GAME = 30;

export const Line: React.FC<LineProps> = ({
  priceData,
  chartDimensions,
  isConnected,
  gridCells,
  gridConfig,
  gameProgress,
  gameNumber,
  currentColumnIndex,
  gameStartTime,
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

    // Get current column boundaries
    const blocksPerRow = gridConfig.cols;
    const blocksPerColumn = gridConfig.rows;

    // Get all cells in current column
    const columnCells: GridCell[] = [];
    for (let row = 0; row < blocksPerColumn; row++) {
      const cellIndex = row * blocksPerRow + currentColumnIndex;
      if (cellIndex < gridCells.length) {
        columnCells.push(gridCells[cellIndex]);
      }
    }

    if (columnCells.length === 0) return;

    // Calculate column boundaries
    const columnLeft = columnCells[0].x;
    const columnRight = columnCells[0].x + columnCells[0].width;
    const columnTop = columnCells[0].y;
    const columnBottom =
      columnCells[columnCells.length - 1].y +
      columnCells[columnCells.length - 1].height;
    const columnWidth = columnRight - columnLeft;
    const columnHeight = columnBottom - columnTop;

    // Draw column highlight (optional - for debugging)
    ctx.strokeStyle = "rgba(252, 229, 124, 0.1)";
    ctx.lineWidth = 1;
    ctx.strokeRect(columnLeft, columnTop, columnWidth, columnHeight);

    if (priceData.length > 0) {
      // Filter data for current game only
      const currentGameData = priceData.filter(
        (p) => p.timestamp >= gameStartTime
      );

      if (currentGameData.length === 0) return;

      const { min, max } = getMinMaxPrice(currentGameData);
      const padding = (max - min) * 0.1 || 1;
      const minPrice = min - padding;
      const maxPrice = max + padding;

      // Create gradient for the line
      const gradient = ctx.createLinearGradient(columnLeft, 0, columnRight, 0);
      gradient.addColorStop(0.0, "#FAE279");
      gradient.addColorStop(0.2, "#E9BD49");
      gradient.addColorStop(0.4, "#FCE57C");
      gradient.addColorStop(0.6, "#FAE279");
      gradient.addColorStop(0.8, "#FBEBB0");
      gradient.addColorStop(1.0, "#E9BD49");

      const lineWidth = Math.max(2, columnWidth * 0.02);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();

      let lastX = 0;
      let lastY = 0;

      // Draw the price line within the column
      currentGameData.forEach((data, i) => {
        // Calculate time progress within the game (0 to 1)
        const timeElapsed = (data.timestamp - gameStartTime) / 1000; // seconds
        const timeProgress = Math.min(timeElapsed / SECONDS_PER_GAME, 1);

        // X position: moves from left to right of the column based on time
        const x = columnLeft + columnWidth * timeProgress;

        // Y position: based on price relative to column height
        const normalizedY = (data.price - minPrice) / (maxPrice - minPrice);
        // Invert Y because canvas coordinates are top-down
        const y =
          columnBottom - normalizedY * columnHeight * 0.9 - columnHeight * 0.05;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          // Draw smooth curve between points
          const cpx = (lastX + x) / 2;
          const cpy = (lastY + y) / 2;
          ctx.quadraticCurveTo(lastX, lastY, cpx, cpy);
        }

        lastX = x;
        lastY = y;
      });

      // Final line segment
      if (currentGameData.length > 1) {
        ctx.lineTo(lastX, lastY);
      }

      ctx.stroke();

      // Draw the current price point
      if (currentGameData.length > 0) {
        const pointRadius = Math.max(3, columnWidth * 0.05);
        const pointOuterRadius = Math.max(6, columnWidth * 0.1);

        // Outer glow
        ctx.fillStyle = "rgba(252, 229, 124, 0.3)";
        ctx.beginPath();
        ctx.arc(lastX, lastY, pointOuterRadius, 0, 2 * Math.PI);
        ctx.fill();

        // Inner point
        ctx.fillStyle = "#FCE57C";
        ctx.beginPath();
        ctx.arc(lastX, lastY, pointRadius, 0, 2 * Math.PI);
        ctx.fill();

        // Price label
        const lastData = currentGameData[currentGameData.length - 1];
        ctx.fillStyle = "#FFFFFF";
        const fontSize = Math.max(10, columnWidth * 0.15);
        ctx.font = `bold ${fontSize}px Arial`;
        const priceText = `$${lastData.price.toFixed(2)}`;
        const textWidth = ctx.measureText(priceText).width;

        // Position text to avoid column edges
        let textX = lastX + 10;
        if (textX + textWidth > columnRight - 5) {
          textX = lastX - textWidth - 10;
        }

        ctx.fillText(priceText, textX, lastY);
      }

      // Draw vertical progress line
      const currentX = columnLeft + columnWidth * gameProgress;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(currentX, columnTop);
      ctx.lineTo(currentX, columnBottom);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw game timer at bottom of column
      const remainingTime = Math.ceil(
        SECONDS_PER_GAME - gameProgress * SECONDS_PER_GAME
      );
      ctx.fillStyle = "#FCE57C";
      ctx.font = `bold 12px Arial`;
      ctx.textAlign = "center";
      ctx.fillText(
        `${remainingTime}s`,
        columnLeft + columnWidth / 2,
        columnBottom + 20
      );
      ctx.textAlign = "left";

      // Draw column number
      ctx.fillStyle = "rgba(252, 229, 124, 0.6)";
      ctx.font = `10px Arial`;
      ctx.fillText(
        `Game ${currentColumnIndex + 1}`,
        columnLeft + 5,
        columnTop - 5
      );
    } else if (isConnected) {
      // Waiting for data - show in current column
      ctx.fillStyle = "rgba(252, 229, 124, 0.1)";
      const boxWidth = Math.min(150, columnWidth * 0.8);
      const boxHeight = 40;
      const boxX = columnLeft + (columnWidth - boxWidth) / 2;
      const boxY = columnTop + (columnHeight - boxHeight) / 2;

      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
      ctx.fillStyle = "#FCE57C";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        "Waiting for data...",
        columnLeft + columnWidth / 2,
        boxY + 25
      );
      ctx.textAlign = "left";
    }

    // Global status indicator
    ctx.font = "12px Arial";
    ctx.fillStyle = isConnected ? "#FCE57C" : "#FF0000";
    const statusText = isConnected ? "● LIVE" : "● OFFLINE";
    ctx.fillText(statusText, chartDimensions.width - 60, 20);

    // Overall game info
    ctx.fillStyle = "#FCE57C";
    ctx.font = "bold 14px Arial";
    ctx.fillText(`Round ${Math.floor(gameNumber / blocksPerRow) + 1}`, 10, 20);
  }, [
    priceData,
    chartDimensions,
    isConnected,
    gridCells,
    gridConfig,
    gameProgress,
    gameNumber,
    currentColumnIndex,
    gameStartTime,
  ]);

  return <canvas ref={canvasRef} className={styles.canvas} />;
};
