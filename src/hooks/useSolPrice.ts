import { useState, useEffect, useCallback, useRef } from "react";
import { PriceData } from "../types";
import { SolPriceHTTP } from "../services/httpService";

export const useSolPrice = () => {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const serviceRef = useRef<SolPriceHTTP | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handlePrice = useCallback((data: PriceData) => {
    setCurrentPrice(data.price);
    setPriceData(prev => [...prev, data].slice(-1000));
  }, []);

  useEffect(() => {
    const cleanup = () => {
      serviceRef.current?.disconnect();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };

    cleanup();

    const service = new SolPriceHTTP(handlePrice);
    serviceRef.current = service;
    service.connect();

    intervalRef.current = setInterval(() => {
      setIsConnected(service.isConnected());
    }, 1000);

    return cleanup;
  }, [handlePrice]);

  return {
    priceData,
    currentPrice,
    isConnected,
    clearData: () => setPriceData([]),
  };
};
