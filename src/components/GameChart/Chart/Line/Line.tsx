import React, { useRef, useEffect } from "react";
import { PriceData, GridCell, GridConfig } from "@/types";
import styles from "./Line.module.scss";

interface PriceZone {
  row: number;
  priceMin: number;
  priceMax: number;
  label: string;
}

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
  allGamesData: {
    columnIndex: number;
    data: PriceData[];
    startTime: number;
  }[];
  priceZones: PriceZone[];
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
  allGamesData,
  priceZones,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx || gridCells.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = chartDimensions.width * dpr;
    canvas.height = chartDimensions.height * dpr;
    canvas.style.width = `${chartDimensions.width}px`;
    canvas.style.height = `${chartDimensions.height}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, chartDimensions.width, chartDimensions.height);

    const { cols: blocksPerRow, rows: blocksPerColumn } = gridConfig;

    // Get global price bounds from zones
    const globalMin = Math.min(...priceZones.map((z) => z.priceMin));
    const globalMax = Math.max(...priceZones.map((z) => z.priceMax));
    const padding = (globalMax - globalMin) * 0.02;
    const adjustedMin = globalMin - padding;
    const adjustedMax = globalMax + padding;

    // Get column cells
    const getColumnCells = (colIndex: number): GridCell[] => {
      const cells: GridCell[] = [];
      for (let row = 0; row < blocksPerColumn; row++) {
        const cellIndex = row * blocksPerRow + colIndex;
        if (cellIndex < gridCells.length) {
          cells.push(gridCells[cellIndex]);
        }
      }
      return cells;
    };

    // Get column boundaries
    const getColumnBounds = (colIndex: number) => {
      const cells = getColumnCells(colIndex);
      if (cells.length === 0) return null;

      return {
        left: cells[0].x,
        right: cells[0].x + cells[0].width,
        top: cells[0].y,
        bottom: cells[cells.length - 1].y + cells[cells.length - 1].height,
        width: cells[0].width,
        height:
          cells[cells.length - 1].y +
          cells[cells.length - 1].height -
          cells[0].y,
      };
    };

    // Draw price zones
    const drawPriceZones = () => {
      for (let row = 0; row < blocksPerColumn; row++) {
        const zone = priceZones.find((zone) => zone.row === row);
        if (!zone) continue;

        const rowCells = [];
        for (let col = 0; col < blocksPerRow; col++) {
          const cellIndex = row * blocksPerRow + col;
          if (cellIndex < gridCells.length) {
            rowCells.push(gridCells[cellIndex]);
          }
        }

        if (rowCells.length === 0) continue;

        const firstCell = rowCells[0];
        const lastCell = rowCells[rowCells.length - 1];
        const rowTop = firstCell.y;
        const rowLeft = firstCell.x;
        const rowRight = lastCell.x + lastCell.width;

        // Draw zone border
        ctx.strokeStyle = "rgba(252, 229, 124, 0.3)";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(rowLeft, rowTop);
        ctx.lineTo(rowRight, rowTop);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw zone labels
        if (row % 2 === 0 || priceZones.length <= 6) {
          ctx.fillStyle = "rgba(252, 229, 124, 0.8)";
          ctx.font = "10px Arial";
          ctx.textAlign = "left";
          ctx.fillText(
            `${zone.priceMin.toFixed(3)}-${zone.priceMax.toFixed(3)}`,
            rowRight + 5,
            rowTop + 12
          );
        }
      }
    };

    drawPriceZones();

    // Convert price to Y coordinate
    const priceToY = (price: number, bounds: any) => {
      const normalizedPrice =
        (price - adjustedMin) / (adjustedMax - adjustedMin);
      return (
        bounds.bottom -
        normalizedPrice * bounds.height * 0.9 -
        bounds.height * 0.05
      );
    };

    // Get line gradient
    const getLineColor = () => {
      const gradient = ctx.createLinearGradient(0, 0, chartDimensions.width, 0);
      gradient.addColorStop(0.0, "#FAE279");
      gradient.addColorStop(0.2, "#E9BD49");
      gradient.addColorStop(0.4, "#FCE57C");
      gradient.addColorStop(0.6, "#FAE279");
      gradient.addColorStop(0.8, "#FBEBB0");
      gradient.addColorStop(1.0, "#E9BD49");
      return gradient;
    };

    // Draw game line
    const drawGameLine = (
      ctx: CanvasRenderingContext2D,
      data: PriceData[],
      bounds: {
        left: number;
        right: number;
        top: number;
        bottom: number;
        width: number;
        height: number;
      },
      startTime: number,
      isCurrent: boolean
    ) => {
      if (data.length === 0) return;

      ctx.strokeStyle = getLineColor();
      ctx.lineWidth = isCurrent ? 3 : 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();

      let lastX = 0;
      let lastY = 0;

      data.forEach((point, i) => {
        const timeElapsed = (point.timestamp - startTime) / 1000;
        const timeProgress = Math.min(timeElapsed / SECONDS_PER_GAME, 1);
        const x = bounds.left + bounds.width * timeProgress;
        const y = priceToY(point.price, bounds);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          const cpx = (lastX + x) / 2;
          const cpy = (lastY + y) / 2;
          ctx.quadraticCurveTo(lastX, lastY, cpx, cpy);
        }

        lastX = x;
        lastY = y;
      });

      if (data.length > 1) {
        ctx.lineTo(lastX, lastY);
      }

      ctx.stroke();

      // Draw current game indicators
      if (isCurrent && data.length > 0) {
        const pointRadius = Math.max(3, bounds.width * 0.05);
        const pointOuterRadius = Math.max(6, bounds.width * 0.1);

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
        const lastData = data[data.length - 1];
        ctx.fillStyle = "#FFFFFF";
        const fontSize = Math.max(10, bounds.width * 0.15);
        ctx.font = `bold ${fontSize}px Arial`;
        const priceText = `${lastData.price.toFixed(2)}`;
        const textWidth = ctx.measureText(priceText).width;

        let textX = lastX + 10;
        if (textX + textWidth > bounds.right - 5) {
          textX = lastX - textWidth - 10;
        }

        ctx.fillText(priceText, textX, lastY);

        // Progress line
        const currentX = bounds.left + bounds.width * gameProgress;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(currentX, bounds.top);
        ctx.lineTo(currentX, bounds.bottom);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    };

    // Draw historical games
    allGamesData.forEach((gameData) => {
      const columnBounds = getColumnBounds(gameData.columnIndex);
      if (columnBounds && gameData.data.length > 0) {
        drawGameLine(
          ctx,
          gameData.data,
          columnBounds,
          gameData.startTime,
          false
        );
      }
    });

    // Draw current game
    const currentColumnBounds = getColumnBounds(currentColumnIndex);
    if (currentColumnBounds && priceData.length > 0) {
      // Highlight current column
      ctx.fillStyle = "rgba(252, 229, 124, 0.1)";
      ctx.fillRect(
        currentColumnBounds.left,
        currentColumnBounds.top,
        currentColumnBounds.width,
        currentColumnBounds.height
      );

      // Current column border
      ctx.strokeStyle = "#FCE57C";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        currentColumnBounds.left,
        currentColumnBounds.top,
        currentColumnBounds.width,
        currentColumnBounds.height
      );

      drawGameLine(ctx, priceData, currentColumnBounds, gameStartTime, true);

      // Game timer
      const remainingTime = Math.ceil(
        SECONDS_PER_GAME - gameProgress * SECONDS_PER_GAME
      );
      ctx.fillStyle = "#FCE57C";
      ctx.font = `bold 12px Arial`;
      ctx.textAlign = "center";
      ctx.fillText(
        `${remainingTime}s`,
        currentColumnBounds.left + currentColumnBounds.width / 2,
        currentColumnBounds.bottom + 20
      );
      ctx.textAlign = "left";
    }

    // Connect lines between columns
    if (allGamesData.length > 0) {
      ctx.strokeStyle = "rgba(252, 229, 124, 0.5)";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);

      for (let i = 0; i < allGamesData.length - 1; i++) {
        const currentGame = allGamesData[i];
        const nextGame = allGamesData[i + 1];

        if (currentGame.data.length > 0 && nextGame.data.length > 0) {
          const currentBounds = getColumnBounds(currentGame.columnIndex);
          const nextBounds = getColumnBounds(nextGame.columnIndex);

          if (currentBounds && nextBounds) {
            const lastPrice =
              currentGame.data[currentGame.data.length - 1].price;
            const firstPrice = nextGame.data[0].price;
            const lastY = priceToY(lastPrice, currentBounds);
            const firstY = priceToY(firstPrice, nextBounds);

            ctx.beginPath();
            ctx.moveTo(currentBounds.right, lastY);
            ctx.lineTo(nextBounds.left, firstY);
            ctx.stroke();
          }
        }
      }

      // Connect last historical to current
      if (priceData.length > 0 && allGamesData.length > 0) {
        const lastGame = allGamesData[allGamesData.length - 1];
        if (lastGame.data.length > 0) {
          const lastBounds = getColumnBounds(lastGame.columnIndex);
          const currentBounds = getColumnBounds(currentColumnIndex);

          if (lastBounds && currentBounds) {
            const lastPrice = lastGame.data[lastGame.data.length - 1].price;
            const firstPrice = priceData[0].price;
            const lastY = priceToY(lastPrice, lastBounds);
            const firstY = priceToY(firstPrice, currentBounds);

            ctx.beginPath();
            ctx.moveTo(lastBounds.right, lastY);
            ctx.lineTo(currentBounds.left, firstY);
            ctx.stroke();
          }
        }
      }

      ctx.setLineDash([]);
    }

    // Status indicator
    ctx.font = "12px Arial";
    ctx.fillStyle = isConnected ? "#FCE57C" : "#FF0000";
    ctx.textAlign = "left";
    ctx.fillText(
      isConnected ? "● LIVE" : "● OFFLINE",
      chartDimensions.width - 60,
      20
    );

    // Round info
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
    allGamesData,
    priceZones,
  ]);

  return <canvas ref={canvasRef} className={styles.canvas} />;
};
