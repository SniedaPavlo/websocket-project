import { useState, useEffect, useCallback } from "react";
import { PriceData } from "../types";
import { SolPriceWebSocket } from "../services/websocket";

export const useSolPrice = (websocketUrl?: string) => {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [, setWs] = useState<SolPriceWebSocket | null>(null);

  const handleNewPrice = useCallback((data: PriceData) => {
    console.log("📊 Received new price data:", data);
    setCurrentPrice(data.price);
    setPriceData((prev) => {
      const newData = [...prev, data];
      console.log("📈 Total data points:", newData.length);
      // Keep only last 1000 data points for performance
      return newData.slice(-1000);
    });
  }, []);

  useEffect(() => {
    const url =
      websocketUrl || "wss://stream.binance.com:9443/ws/solusdt@ticker";
    const webSocket = new SolPriceWebSocket(url, handleNewPrice);

    webSocket.connect();
    setWs(webSocket);

    const checkConnection = setInterval(() => {
      setIsConnected(webSocket.isConnected());
    }, 1000);

    return () => {
      clearInterval(checkConnection);
      webSocket.disconnect();
    };
  }, [handleNewPrice, websocketUrl]);

  return {
    priceData,
    currentPrice,
    isConnected,
    clearData: () => setPriceData([]),
  };
};
