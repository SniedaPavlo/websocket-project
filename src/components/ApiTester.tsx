import React, { useEffect, useRef } from "react";
import { BananaZoneClient } from "../services/httpService";

export const ApiTester: React.FC = () => {
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const testAPI = async () => {
      const client = new BananaZoneClient();

      try {
        // TEST 1: Get all competitions
        const competitions = await client.competitions.getAll();
        console.log("[GET] /competition →", competitions.length, "items");
      } catch (err) {
        console.error("[GET] /competition → ❌", err);
      }

      try {
        // TEST 4: Ping
        const isOnline = await client.ping();
        console.log("[GET] /ping →", isOnline ? "ONLINE ✅" : "OFFLINE ❌");
      } catch (err) {
        console.error("[GET] /ping → ❌", err);
      }
    };

    testAPI();
  }, []);

  return null;
};
