import { useState, useEffect, useCallback, useRef } from "react";
import { PriceData } from "../types";
import {
  BananaZoneClient,
  BananaZoneWebSocket,
  Competition,
  Pool,
  SnapshotMessage,
  PoolAddedMessage,
  PoolRemovedMessage,
  PoolClosedMessage,
  PoolResolvedMessage,
  OutcomeUpdatedMessage,
  BetCreatedMessage,
  BetConfirmedMessage,
} from "../services/httpService";

interface BananaZoneState {
  competitions: Competition[];
  pools: Pool[];
  currentPrice: number;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  selectedCompetition: Competition | null;
}

export const useBananaZone = (jwt: string) => {
  const [state, setState] = useState<BananaZoneState>({
    competitions: [],
    pools: [],
    currentPrice: 0,
    isConnected: false,
    isLoading: false,
    error: null,
    selectedCompetition: null,
  });

  const clientRef = useRef<BananaZoneClient | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Update state with partial data
   */
  const updateState = useCallback((updates: Partial<BananaZoneState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  /**
   * Handle WebSocket events
   */
  const setupWebSocketHandlers = useCallback(
    (ws: BananaZoneWebSocket) => {
      // Initial snapshot with 8 pools
      ws.onSnapshot((data: SnapshotMessage) => {
        console.log(
          "📊 Received initial snapshot:",
          data.pools.length,
          "pools"
        );
        updateState({
          pools: data.pools,
          isConnected: true,
          isLoading: false,
          error: null,
        });
      });

      // New pool added (slide down animation)
      ws.onPoolAdded((data: PoolAddedMessage) => {
        console.log("➕ Pool added:", data.pool.poolId);
        setState((prev) => ({
          ...prev,
          pools: [data.pool, ...prev.pools.slice(0, 7)], // Keep only 8 pools
        }));
      });

      // Pool removed (slide up animation)
      ws.onPoolRemoved((data: PoolRemovedMessage) => {
        console.log("➖ Pool removed:", data.poolId);
        setState((prev) => ({
          ...prev,
          pools: prev.pools.filter((pool) => pool.poolId !== data.poolId),
        }));
      });

      // Pool closed (disable betting)
      ws.onPoolClosed((data: PoolClosedMessage) => {
        console.log("🔒 Pool closed:", data.poolId);
        setState((prev) => ({
          ...prev,
          pools: prev.pools.map((pool) =>
            pool.poolId === data.poolId ? { ...pool, status: "CLOSED" } : pool
          ),
        }));
      });

      // Pool resolved (show winner)
      ws.onPoolResolved((data: PoolResolvedMessage) => {
        console.log(
          "🏆 Pool resolved:",
          data.poolId,
          "Winner:",
          data.winningOutcomeId
        );
        setState((prev) => ({
          ...prev,
          pools: prev.pools.map((pool) =>
            pool.poolId === data.poolId ? { ...pool, status: "RESOLVED" } : pool
          ),
        }));
      });

      // Outcome updated (odds changed)
      ws.onOutcomeUpdated((data: OutcomeUpdatedMessage) => {
        console.log(
          "📈 Outcome updated:",
          data.poolId,
          data.outcomeId,
          "Odds:",
          data.odds
        );
        setState((prev) => ({
          ...prev,
          pools: prev.pools.map((pool) =>
            pool.poolId === data.poolId
              ? {
                  ...pool,
                  outcomes: pool.outcomes.map((outcome) =>
                    outcome.outcomeId === data.outcomeId
                      ? { ...outcome, odds: data.odds, active: data.active }
                      : outcome
                  ),
                }
              : pool
          ),
        }));
      });

      // Bet created (public notification)
      ws.onBetCreated((data: BetCreatedMessage) => {
        console.log(
          "💰 Bet created:",
          data.bet.betId,
          "Amount:",
          data.bet.amount
        );
        // Optional: Show notification or update UI
      });

      // Bet confirmed (private notification)
      ws.onBetConfirmed((data: BetConfirmedMessage) => {
        console.log("✅ Bet confirmed:", data.betId, "TX:", data.txHash);
        // Update UI to show bet confirmation
      });

      // Connection status
      ws.onConnection((connected: boolean) => {
        console.log(
          "🔌 Connection status:",
          connected ? "Connected" : "Disconnected"
        );
        updateState({ isConnected: connected });

        if (!connected) {
          // Attempt to reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectToWebSocket();
          }, 3000);
        }
      });
    },
    [updateState]
  );

  /**
   * Initialize client and fetch competitions
   */
  const initializeClient = useCallback(async () => {
    try {
      updateState({ isLoading: true, error: null });

      // Create client
      const client = new BananaZoneClient(jwt);
      clientRef.current = client;

      // Fetch competitions
      const competitions = await client.getAPI().getCompetitions();
      console.log("🏆 Competitions loaded:", competitions.length);

      if (competitions.length > 0) {
        const selectedCompetition = competitions[0]; // Use first competition
        updateState({
          competitions,
          selectedCompetition,
          isLoading: false,
        });

        // Connect to WebSocket for the selected competition
        await connectToWebSocket(selectedCompetition.competitionKey);
      } else {
        updateState({
          error: "No competitions available",
          isLoading: false,
        });
      }
    } catch (error) {
      console.error("❌ Failed to initialize client:", error);
      updateState({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  }, [jwt, updateState]);

  /**
   * Connect to WebSocket for a specific competition
   */
  const connectToWebSocket = useCallback(
    async (competitionKey: string) => {
      try {
        if (!clientRef.current) return;

        console.log("🔌 Connecting to WebSocket for:", competitionKey);
        const ws = await clientRef.current.connectWebSocket(competitionKey);
        setupWebSocketHandlers(ws);

        // Also fetch initial pools via REST API
        const poolsData = await clientRef.current
          .getAPI()
          .getActivePools(competitionKey);
        console.log("🎮 Initial pools fetched:", poolsData.count);

        // Update current price if available
        if (poolsData.data.length > 0 && poolsData.data[0].currentPrice) {
          updateState({ currentPrice: poolsData.data[0].currentPrice });
        }
      } catch (error) {
        console.error("❌ Failed to connect to WebSocket:", error);
        updateState({
          error:
            error instanceof Error
              ? error.message
              : "WebSocket connection failed",
          isConnected: false,
        });
      }
    },
    [setupWebSocketHandlers, updateState]
  );

  /**
   * Reconnect to WebSocket
   */
  const reconnectToWebSocket = useCallback(async () => {
    if (state.selectedCompetition) {
      console.log("🔄 Attempting to reconnect...");
      await connectToWebSocket(state.selectedCompetition.competitionKey);
    }
  }, [state.selectedCompetition, connectToWebSocket]);

  /**
   * Switch to a different competition
   */
  const switchCompetition = useCallback(
    async (competition: Competition) => {
      updateState({ selectedCompetition: competition, isLoading: true });
      await connectToWebSocket(competition.competitionKey);
    },
    [connectToWebSocket, updateState]
  );

  /**
   * Create a bet
   */
  const createBet = useCallback(
    async (poolId: string, outcomeId: string, amount: number) => {
      try {
        if (!clientRef.current) throw new Error("Client not initialized");

        console.log("💰 Creating bet:", { poolId, outcomeId, amount });
        const result = await clientRef.current
          .getAPI()
          .createBet(poolId, outcomeId, amount, jwt);

        console.log("✅ Bet created successfully:", result);
        return result;
      } catch (error) {
        console.error("❌ Failed to create bet:", error);
        throw error;
      }
    },
    [jwt]
  );

  /**
   * Cancel a bet
   */
  const cancelBet = useCallback(
    async (betId: string) => {
      try {
        if (!clientRef.current) throw new Error("Client not initialized");

        console.log("❌ Cancelling bet:", betId);
        const result = await clientRef.current.getAPI().cancelBet(betId, jwt);

        console.log("✅ Bet cancelled successfully:", result);
        return result;
      } catch (error) {
        console.error("❌ Failed to cancel bet:", error);
        throw error;
      }
    },
    [jwt]
  );

  /**
   * Get pool by ID
   */
  const getPoolById = useCallback(
    (poolId: string): Pool | undefined => {
      return state.pools.find((pool) => pool.poolId === poolId);
    },
    [state.pools]
  );

  /**
   * Get active pools (status: ACTIVE)
   */
  const getActivePools = useCallback((): Pool[] => {
    return state.pools.filter((pool) => pool.status === "ACTIVE");
  }, [state.pools]);

  /**
   * Cleanup function
   */
  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
  }, []);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    initializeClient();
    return cleanup;
  }, [initializeClient, cleanup]);

  /**
   * Update current price from active pools
   */
  useEffect(() => {
    const activePools = getActivePools();
    if (activePools.length > 0 && activePools[0].currentPrice) {
      updateState({ currentPrice: activePools[0].currentPrice });
    }
  }, [state.pools, getActivePools, updateState]);

  return {
    // State
    competitions: state.competitions,
    pools: state.pools,
    currentPrice: state.currentPrice,
    isConnected: state.isConnected,
    isLoading: state.isLoading,
    error: state.error,
    selectedCompetition: state.selectedCompetition,

    // Actions
    switchCompetition,
    createBet,
    cancelBet,
    reconnect: reconnectToWebSocket,

    // Helpers
    getPoolById,
    getActivePools,
    cleanup,
  };
};

// Legacy hook for backward compatibility
// export const useSolPrice = (jwt: string) => {
//   const { pools, currentPrice, isConnected, isLoading, error, cleanup } =
//     useBananaZone(jwt);

//   // Convert pools to price data format for compatibility
//   const priceData: PriceData[] = pools.map((pool) => ({
//     timestamp: pool.startTime,
//     price: pool.currentPrice || currentPrice,
//   }));

//   return {
//     priceData,
//     currentPrice,
//     isConnected,
//     isLoading,
//     error,
//     clearData: cleanup,
//   };
// };

export const useSolPrice = (jwt?: string) => {
  const { pools, currentPrice, isConnected, isLoading, error, cleanup } =
    useBananaZone(jwt || "");

  // Convert pools to price data format for compatibility
  const priceData: PriceData[] = pools.map((pool) => ({
    timestamp: pool.startTime,
    price: pool.currentPrice || currentPrice,
  }));

  return {
    priceData,
    currentPrice,
    isConnected,
    isLoading,
    error,
    clearData: cleanup,
  };
};
