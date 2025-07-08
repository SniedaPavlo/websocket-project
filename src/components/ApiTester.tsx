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
        // TEST 2: Get active competitions
        const active = await client.competitions.getActive();
        console.log("[GET] /competition/active →", active.length, "active");
      } catch (err) {
        console.error("[GET] /competition/active → ❌", err);
      }

      try {
        // TEST 3: Get competition by key
        const key = "5131FyiapyPHMwoLrzxNtpg13nNDvYprK5GJ2eQreaq2";
        const comp = await client.competitions.getByKey(key);
        if (comp) {
          console.log("[GET] /competition/" + key + " → ✅ found");
        } else {
          console.log("[GET] /competition/" + key + " → ❌ not found");
        }
      } catch (err) {
        console.error("[GET] /competition/:key → ❌", err);
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
