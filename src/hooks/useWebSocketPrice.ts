import { useEffect, useRef, useState } from "react";
import { PriceData } from "@/types";
import { BananaZoneClient } from "../libs/api/index";

interface UseWebSocketPriceOptions {
  feed: string;
  maxDataPoints?: number;
}

export const useWebSocketPrice = ({
  feed,
  maxDataPoints = 100,
}: UseWebSocketPriceOptions) => {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const hasRunRef = useRef(false);
  const wsClientRef = useRef<any>(null);

  useEffect(() => {
    // Prevent double execution
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const connectWebSocket = async () => {
      try {
        console.log("🔍 Starting WebSocket connection for feed:", feed);

        // Create client
        const client = new BananaZoneClient();

        // Create WebSocket connection (same as ApiTester)
        const wsClient = client.websocket.createConnection({
          feed,
          from: Math.floor(Date.now() / 1000) - 60, // Last minute
        });

        // Store reference
        wsClientRef.current = wsClient;

        // Connect
        const ws = await wsClient.connect();
        console.log("✅ WebSocket connected successfully!");
        setIsConnected(true);

        // Set up message handler (same as ApiTester)
        wsClient.onMessage((data: any) => {
          console.log("📨 WebSocket message:", data);

          // Parse data: [timestamp, scaledPrice]
          if (Array.isArray(data) && data.length === 2) {
            const [timestamp, scaledPrice] = data;
            const actualPrice = scaledPrice / 100000;

            const newPoint: PriceData = {
              timestamp: timestamp * 1000,
              price: actualPrice,
            };

            setPriceData((prev) => {
              const updated = [...prev, newPoint];
              // Keep only last maxDataPoints
              if (updated.length > maxDataPoints) {
                return updated.slice(-maxDataPoints);
              }
              return updated;
            });
          }
        });
      } catch (err) {
        console.error("❌ WebSocket connection failed:", err);
        setIsConnected(false);
      }
    };

    connectWebSocket();

    // Cleanup
    return () => {
      if (wsClientRef.current) {
        wsClientRef.current.disconnect();
        console.log("🧹 WebSocket disconnected");
      }
      hasRunRef.current = false;
    };
  }, [feed, maxDataPoints]);

  return { priceData, isConnected };
};
