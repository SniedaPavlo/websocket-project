import { useState, useEffect, useRef } from "react";
import { PriceData } from "@/types";

interface UseWebSocketPriceOptions {
  feed: string;
  maxDataPoints?: number;
}

interface UseWebSocketPriceReturn {
  priceData: PriceData[];
  isConnected: boolean;
  lastPrice: number | null;
  error: string | null;
}

// Функция для обработки данных с WebSocket
const processWebSocketData = (rawData: [number, number]): PriceData => {
  const [timestamp, rawPrice] = rawData;
  // Преобразуем цену: 16111248780 -> 161.11
  const price = rawPrice / 100000000;
  return {
    price: parseFloat(price.toFixed(2)),
    timestamp: timestamp * 1000, // конвертируем в миллисекунды
  };
};

export const useWebSocketPrice = ({
  feed,
  maxDataPoints = 1000,
}: UseWebSocketPriceOptions): UseWebSocketPriceReturn => {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    try {
      // Замените на ваш WebSocket URL
      const wsUrl = `wss://your-websocket-url/${feed}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const rawData = JSON.parse(event.data);

          // Проверяем формат данных [timestamp, price]
          if (Array.isArray(rawData) && rawData.length === 2) {
            //@ts-ignore
            const processedData = processWebSocketData(rawData);

            setPriceData((prev) => {
              const newData = [...prev, processedData];
              // Ограничиваем количество точек данных
              if (newData.length > maxDataPoints) {
                return newData.slice(-maxDataPoints);
              }
              return newData;
            });

            setLastPrice(processedData.price);
          } else {
            console.warn("Unexpected data format:", rawData);
          }
        } catch (err) {
          console.error("Error processing WebSocket message:", err);
          setError("Error processing data");
        }
      };

      wsRef.current.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        setIsConnected(false);

        // Попытка переподключения
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttempts.current),
            30000
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(
              `Attempting to reconnect... (${reconnectAttempts.current}/${maxReconnectAttempts})`
            );
            connect();
          }, delay);
        } else {
          setError("Failed to connect after multiple attempts");
        }
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setError("WebSocket connection error");
      };
    } catch (err) {
      console.error("Failed to create WebSocket connection:", err);
      setError("Failed to establish connection");
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [feed]);

  return {
    priceData,
    isConnected,
    lastPrice,
    error,
  };
};
