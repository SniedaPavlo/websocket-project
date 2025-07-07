import { useState, useEffect, useCallback, useRef } from "react";
import { PriceData } from "../types";
import { SolPriceHTTP } from "../services/websocket";

export const useSolPrice = () => {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState<boolean>(false);
  const httpServiceRef = useRef<SolPriceHTTP | null>(null);
  const connectionCheckRef = useRef<NodeJS.Timeout | null>(null);
  const connectionStartTime = useRef<number>(0);

  const handleNewPrice = useCallback((data: PriceData) => {
    setCurrentPrice(data.price);
    setPriceData((prev) => {
      const newData = [...prev, data];
      
      // Check if we're still in history loading phase (first 4 seconds)
      const timeSinceStart = Date.now() - connectionStartTime.current;
      if (timeSinceStart < 4000 && !isHistoryLoaded) {
        return newData.slice(-1000);
      } else if (!isHistoryLoaded) {
        setIsHistoryLoaded(true);
      }
      
      return newData.slice(-1000);
    });
  }, [isHistoryLoaded]);

  useEffect(() => {
    if (httpServiceRef.current) {
      httpServiceRef.current.disconnect();
      httpServiceRef.current = null;
    }

    if (connectionCheckRef.current) {
      clearInterval(connectionCheckRef.current);
      connectionCheckRef.current = null;
    }

    const httpService = new SolPriceHTTP(handleNewPrice);
    httpServiceRef.current = httpService;

    connectionStartTime.current = Date.now();
    httpService.connect();

    connectionCheckRef.current = setInterval(() => {
      if (httpServiceRef.current) {
        setIsConnected(httpServiceRef.current.isConnected());
      }
    }, 1000);

    return () => {
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
    isHistoryLoaded,
    clearData: () => setPriceData([]),
  };
};
