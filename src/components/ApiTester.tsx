import React, { useEffect, useRef } from "react";
import { BananaZoneClient } from "../libs/api";

export const ApiTester: React.FC = () => {
  const hasRunRef = useRef(false);
  const wsClientRef = useRef<any>(null);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const testAPI = async () => {
      const client = new BananaZoneClient();

      try {
        // TEST 1: Get all competitions
        console.log("🔍 Testing competitions endpoint...");
        const competitions = await client.competitions.getAll();
        console.log("[GET] /competition →", competitions.length, "items");
        console.log("Sample competition:", competitions[0]);
      } catch (err) {
        console.error("[GET] /competition → ❌", err);
      }

      try {
        // TEST 2: Get pools
        console.log("🔍 Testing pools endpoint...");
        const pools = await client.pools.getActivePools({
          competitionKey: "5131FyiapyPHMwoLrzxNtpg13nNDvYprK5GJ2eQreaq2",
          poolsPerPage: 10,
          secondsPerPool: 30,
        });
        console.log("[POST] /pools →", pools ? "pools ✅" : "pools ❌");
        console.log("Pools response:", pools);
      } catch (err) {
        console.error("[POST] /pools → ❌", err);
      }

      // try {
      //   // TEST 3: WebSocket connection
      //   console.log("🔍 Testing WebSocket connection...");

      //   const wsClient = client.websocket.createConnection({
      //     feed: "SOL_USD",
      //     from: 1752142863,
      //   });

      //   // Store reference for cleanup
      //   wsClientRef.current = wsClient;

      //   // Connect
      //   const ws = await wsClient.connect();
      //   console.log("✅ [WebSocket] Connected successfully!");

      //   // Set up message handler
      //   wsClient.onMessage((data) => {
      //     console.log("📨 [WebSocket] Message received:", data);
      //   });

      //   // Test multiple connections
      //   console.log("🔍 Testing multiple WebSocket connections...");
      //   const btcClient = client.websocket.createConnection({
      //     feed: "BTC_USD",
      //   });

      //   try {
      //     await btcClient.connect();
      //     console.log("✅ [BTC WebSocket] Connected");

      //     btcClient.onMessage((data) => {
      //       console.log("📨 [BTC WebSocket] Message:", data);
      //     });

      //     // Disconnect after 5 seconds
      //     setTimeout(() => {
      //       btcClient.disconnect();
      //       console.log("🔌 [BTC WebSocket] Disconnected");
      //     }, 5000);
      //   } catch (err) {
      //     console.error("❌ [BTC WebSocket] Connection failed:", err);
      //   }
      // } catch (err) {
      //   console.error("❌ [WebSocket] Connection failed:", err);
      // }

      try {
        // TEST 4: Cache functionality
        console.log("🔍 Testing cache functionality...");

        // Get competitions (should use cache)
        const cachedCompetitions = await client.competitions.getAll();
        console.log(
          "📦 [Cache] Retrieved from cache:",
          cachedCompetitions.length,
          "items"
        );

        // Force refresh
        const freshCompetitions = await client.competitions.getAll(true);
        console.log(
          "🔄 [Cache] Force refreshed:",
          freshCompetitions.length,
          "items"
        );

        // Clear cache
        client.competitions.clearCache();
        console.log("🧹 [Cache] Cache cleared");

        // Get again (should make new request)
        const newCompetitions = await client.competitions.getAll();
        console.log(
          "🆕 [Cache] New request after clear:",
          newCompetitions.length,
          "items"
        );
      } catch (err) {
        console.error("❌ [Cache] Test failed:", err);
      }

      try {
        // TEST 5: Error handling
        console.log("🔍 Testing error handling...");

        const pools = await client.pools.getActivePools({
          competitionKey: "invalid-key-test",
          poolsPerPage: 10,
          secondsPerPool: 30,
        });
        console.log("🤔 [Error] Should have failed but got:", pools);
      } catch (err) {
        // @ts-ignore
        console.log("✅ [Error] Correctly handled error:", err.message);
      }

      console.log("🎉 API testing completed!");
    };

    testAPI();

    // Cleanup function
    return () => {
      if (wsClientRef.current) {
        wsClientRef.current.disconnect();
        console.log("🧹 Cleaned up WebSocket connection");
      }
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsClientRef.current) {
        wsClientRef.current.disconnect();
        console.log("🧹 Component unmounted, WebSocket disconnected");
      }
    };
  }, []);

  return <div></div>;
};
