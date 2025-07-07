import { useState, useEffect, useCallback, useRef } from "react";
import { PriceData } from "../types";
import { SolPriceHTTP } from "../services/websocket";

export const useSolPrice = () => {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const httpServiceRef = useRef<SolPriceHTTP | null>(null);
  const connectionCheckRef = useRef<NodeJS.Timeout | null>(null);

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
    console.log("🔄 useEffect: Creating HTTP service...");
    
    // Cleanup any existing service
    if (httpServiceRef.current) {
      console.log("🧹 Cleaning up existing HTTP service");
      httpServiceRef.current.disconnect();
      httpServiceRef.current = null;
    }

    if (connectionCheckRef.current) {
      clearInterval(connectionCheckRef.current);
      connectionCheckRef.current = null;
    }

    // Create new service
    const httpService = new SolPriceHTTP(handleNewPrice);
    httpServiceRef.current = httpService;

    httpService.connect();

    connectionCheckRef.current = setInterval(() => {
      if (httpServiceRef.current) {
        setIsConnected(httpServiceRef.current.isConnected());
      }
    }, 1000);

    return () => {
      console.log("🧹 useEffect cleanup: Disconnecting HTTP service");
      if (connectionCheckRef.current) {
        clearInterval(connectionCheckRef.current);
        connectionCheckRef.current = null;
      }
      if (httpServiceRef.current) {
        httpServiceRef.current.disconnect();
        httpServiceRef.current = null;
      }
    };
  }, []); // Removed handleNewPrice dependency to prevent re-creation

  return {
    priceData,
    currentPrice,
    isConnected,
    clearData: () => setPriceData([]),
  };
};
