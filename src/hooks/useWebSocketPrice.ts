import { useEffect, useRef, useState } from "react";
import { PriceData } from "@/types";
import { BananaZoneClient } from "../libs/api";

interface UseWebSocketPriceOptions {
  feed: string;
  maxDataPoints?: number;
  priceScaleFactor?: number;
  priceDecimals?: number;
}

export const useWebSocketPrice = ({
  feed,
  maxDataPoints = 100,
  priceScaleFactor = 100000000,
  priceDecimals = 2, // Default: 2 decimal places
}: UseWebSocketPriceOptions) => {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const wsClientRef = useRef<any>(null);

  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        const client = new BananaZoneClient();
        const wsClient = client.websocket.createConnection({
          feed,
          from: Math.floor(Date.now() / 1000),
        });

        wsClientRef.current = wsClient;
        await wsClient.connect();
        setIsConnected(true);

        wsClient.onMessage((data: any) => {
          if (Array.isArray(data) && data.length === 2) {
            const [timestamp, scaledPrice] = data;

            const rawPrice = scaledPrice / priceScaleFactor;
            const formattedPrice = parseFloat(rawPrice.toFixed(priceDecimals));

            const newPoint: PriceData = {
              timestamp: timestamp * 1000,
              price: formattedPrice,
            };

            setPriceData((prev) => {
              const updated = [...prev, newPoint];
              // Keep only the last maxDataPoints elements
              return updated.length > maxDataPoints
                ? updated.slice(-maxDataPoints)
                : updated;
            });
          }
        });
      } catch (err) {
        console.error("WebSocket connection failed:", err);
        setIsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      if (wsClientRef.current) {
        wsClientRef.current.disconnect();
      }
    };
  }, [feed, maxDataPoints, priceScaleFactor, priceDecimals]);

  return { priceData, isConnected };
};
