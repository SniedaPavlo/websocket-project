import React, { useEffect, useRef } from "react";
import { BananaZoneClient } from "../libs/api";

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
        // TEST 2: Ping
        const isOnline = await client.ping();
        console.log("[GET] /ping →", isOnline ? "ONLINE ✅" : "OFFLINE ❌");
      } catch (err) {
        console.error("[GET] /ping → ❌", err);
      }

      try {
        // TEST 3: pools
        const pools = await client.pools.getActivePools({
          competitionKey: "5131FyiapyPHMwoLrzxNtpg13nNDvYprK5GJ2eQreaq2",
          poolsPerPage: 10,
          secondsPerPool: 30,
        });
        console.log("[GET] /pools →", pools ? "pools ✅" : "pools ❌");
      } catch (err) {
        console.error("[GET] /pools → ❌", err);
      }
    };

    testAPI();
  }, []);

  return null;
};
