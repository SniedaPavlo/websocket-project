import { useState, useEffect, useCallback, useRef } from "react";
import { PriceData } from "../types";
import { SolPriceHTTP } from "../services/httpService";

export const useSolPrice = () => {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const httpServiceRef = useRef<SolPriceHTTP | null>(null);
  const connectionCheckRef = useRef<NodeJS.Timeout | null>(null);

  const handleNewPrice = useCallback((data: PriceData) => {
    setCurrentPrice(data.price);
    setPriceData((prev) => {
      const newData = [...prev, data];
      return newData.slice(-1000);
    });
  }, []);

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
    clearData: () => setPriceData([]),
  };
};
