import { PriceData } from "../types";

// Types for API responses
export interface Competition {
  id: number;
  competitionKey: string;
  priceFeedId: string;
  houseCutFactor: string;
  minPayoutRatio: string;
  interval: number;
  adminKeys: string[];
  admin: string;
  startTime: number;
  endTime: number;
}

export interface Outcome {
  outcomeId: string;
  description: string;
  odds: number;
  active: boolean;
}

export interface Pool {
  poolId: string;
  status: "ACTIVE" | "CLOSED" | "RESOLVED";
  startTime: number;
  endTime: number;
  currentPrice?: number;
  outcomes: Outcome[];
}

export interface Bet {
  betId: string;
  userId: string;
  wallet: string;
  amount: number;
  odds: number;
  createdAt: number;
}

export interface PoolsResponse {
  data: Pool[];
  count: number;
  lastPool: number;
}

// WebSocket message types
export interface WSMessage {
  type:
    | "snapshot"
    | "pool_added"
    | "pool_removed"
    | "pool_closed"
    | "pool_resolved"
    | "outcome_added"
    | "outcome_updated"
    | "bet_created"
    | "bet_confirmed"
    | "ping"
    | "pong";
}

export interface SnapshotMessage extends WSMessage {
  type: "snapshot";
  competitionKey: string;
  serverTime: number;
  pools: Pool[];
}

export interface PoolAddedMessage extends WSMessage {
  type: "pool_added";
  pool: Pool;
}

export interface PoolRemovedMessage extends WSMessage {
  type: "pool_removed";
  poolId: string;
}

export interface PoolClosedMessage extends WSMessage {
  type: "pool_closed";
  poolId: string;
}

export interface PoolResolvedMessage extends WSMessage {
  type: "pool_resolved";
  poolId: string;
  winningOutcomeId: string;
}

export interface OutcomeAddedMessage extends WSMessage {
  type: "outcome_added";
  poolId: string;
  outcome: Outcome;
}

export interface OutcomeUpdatedMessage extends WSMessage {
  type: "outcome_updated";
  poolId: string;
  outcomeId: string;
  odds: number;
  active: boolean;
}

export interface BetCreatedMessage extends WSMessage {
  type: "bet_created";
  bet: Bet;
}

export interface BetConfirmedMessage extends WSMessage {
  type: "bet_confirmed";
  betId: string;
  txHash: string;
}

export interface PingMessage extends WSMessage {
  type: "ping";
  t: number;
}

/**
 * REST API client for BananaZone
 * Handles all HTTP requests to the API
 */
export class BananaZoneAPI {
  private readonly baseUrl = "https://bananazone.app/api";
  private readonly apiKey =
    "d4c3b4f6e2a8c9d0f1e2b3c4d5a6b7c8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b";

  /**
   * Get default headers for API requests
   */
  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      "x-banana-key": this.apiKey,
    };
  }

  /**
   * Fetch all available competitions
   * @returns Promise<Competition[]> List of all competitions
   */
  async getCompetitions(): Promise<Competition[]> {
    console.log("🏆 Fetching competitions...");

    const response = await fetch(`${this.baseUrl}/competition`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch competitions: ${response.status}`);
    }

    const competitions: Competition[] = await response.json();
    console.log("✅ Competitions fetched:", competitions.length);
    return competitions;
  }

  /**
   * Fetch active game pools for a specific competition
   * @param competitionKey - The competition key
   * @param poolsPerPage - Number of pools per page (default: 10)
   * @param secondsPerPool - Duration of each pool in seconds (default: 30)
   * @returns Promise<PoolsResponse> Active pools data
   */
  async getActivePools(
    competitionKey: string,
    poolsPerPage: number = 10,
    secondsPerPool: number = 30
  ): Promise<PoolsResponse> {
    console.log(`🎮 Fetching active pools for competition: ${competitionKey}`);

    const response = await fetch(`${this.baseUrl}/games/pools/active/new`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        competitionKey,
        poolsPerPage,
        secondsPerPool,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch active pools: ${response.status}`);
    }

    const poolsData: PoolsResponse = await response.json();
    console.log("✅ Active pools fetched:", poolsData.count);
    return poolsData;
  }

  /**
   * Create a new bet on a specific outcome
   * @param poolId - The pool ID to bet on
   * @param outcomeId - The outcome ID to bet on
   * @param amount - Bet amount
   * @param jwt - JWT token for authentication
   * @returns Promise<any> Bet creation response
   */
  async createBet(
    poolId: string,
    outcomeId: string,
    amount: number,
    jwt: string
  ): Promise<any> {
    console.log(
      `💰 Creating bet - Pool: ${poolId}, Outcome: ${outcomeId}, Amount: ${amount}`
    );

    const response = await fetch(`${this.baseUrl}/create-bet`, {
      method: "POST",
      headers: {
        ...this.getHeaders(),
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        poolId,
        outcomeId,
        amount,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create bet: ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ Bet created successfully:", result);
    return result;
  }

  /**
   * Cancel an existing bet
   * @param betId - The bet ID to cancel
   * @param jwt - JWT token for authentication
   * @returns Promise<any> Bet cancellation response
   */
  async cancelBet(betId: string, jwt: string): Promise<any> {
    console.log(`❌ Cancelling bet: ${betId}`);

    const response = await fetch(`${this.baseUrl}/cancel-bet`, {
      method: "POST",
      headers: {
        ...this.getHeaders(),
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        betId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel bet: ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ Bet cancelled successfully:", result);
    return result;
  }
}

/**
 * WebSocket client for real-time updates
 * Handles live data streaming from BananaZone
 */
export class BananaZoneWebSocket {
  private ws: WebSocket | null = null;
  private jwt: string;
  private competitionKey: string;
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Event handlers
  private onSnapshotHandler?: (data: SnapshotMessage) => void;
  private onPoolAddedHandler?: (data: PoolAddedMessage) => void;
  private onPoolRemovedHandler?: (data: PoolRemovedMessage) => void;
  private onPoolClosedHandler?: (data: PoolClosedMessage) => void;
  private onPoolResolvedHandler?: (data: PoolResolvedMessage) => void;
  private onOutcomeAddedHandler?: (data: OutcomeAddedMessage) => void;
  private onOutcomeUpdatedHandler?: (data: OutcomeUpdatedMessage) => void;
  private onBetCreatedHandler?: (data: BetCreatedMessage) => void;
  private onBetConfirmedHandler?: (data: BetConfirmedMessage) => void;
  private onConnectionHandler?: (connected: boolean) => void;

  constructor(jwt: string, competitionKey: string) {
    this.jwt = jwt;
    this.competitionKey = competitionKey;
  }

  /**
   * Connect to WebSocket and subscribe to competition
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log("🔌 Connecting to WebSocket...");

      // Use fallback query param for JWT if headers don't work
      const wsUrl = `wss://api.banana.com/ws/stream?token=${this.jwt}`;

      this.ws = new WebSocket(wsUrl, ["jwt"]);

      this.ws.onopen = () => {
        console.log("✅ WebSocket connected");
        this.reconnectAttempts = 0;
        this.onConnectionHandler?.(true);

        // Subscribe to competition immediately after connection
        this.subscribe();
        resolve();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
        this.onConnectionHandler?.(false);
        reject(error);
      };

      this.ws.onclose = (event) => {
        console.log("🔒 WebSocket closed:", event.code, event.reason);
        this.onConnectionHandler?.(false);
        this.cleanup();

        // Attempt to reconnect if not intentionally closed
        if (
          event.code !== 1000 &&
          this.reconnectAttempts < this.maxReconnectAttempts
        ) {
          this.attemptReconnect();
        }
      };
    });
  }

  /**
   * Subscribe to a competition after connection
   */
  private subscribe(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error("❌ Cannot subscribe: WebSocket not connected");
      return;
    }

    console.log(`📡 Subscribing to competition: ${this.competitionKey}`);

    this.ws.send(
      JSON.stringify({
        type: "subscribe",
        competitionKey: this.competitionKey,
      })
    );
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      console.log("📥 Received message:", message.type, message);

      switch (message.type) {
        case "snapshot":
          this.onSnapshotHandler?.(message as SnapshotMessage);
          break;
        case "pool_added":
          this.onPoolAddedHandler?.(message as PoolAddedMessage);
          break;
        case "pool_removed":
          this.onPoolRemovedHandler?.(message as PoolRemovedMessage);
          break;
        case "pool_closed":
          this.onPoolClosedHandler?.(message as PoolClosedMessage);
          break;
        case "pool_resolved":
          this.onPoolResolvedHandler?.(message as PoolResolvedMessage);
          break;
        case "outcome_added":
          this.onOutcomeAddedHandler?.(message as OutcomeAddedMessage);
          break;
        case "outcome_updated":
          this.onOutcomeUpdatedHandler?.(message as OutcomeUpdatedMessage);
          break;
        case "bet_created":
          this.onBetCreatedHandler?.(message as BetCreatedMessage);
          break;
        case "bet_confirmed":
          this.onBetConfirmedHandler?.(message as BetConfirmedMessage);
          break;
        case "ping":
          this.handlePing(message as PingMessage);
          break;
        default:
          console.warn("❓ Unknown message type:", message.type);
      }
    } catch (error) {
      console.error("❌ Failed to parse message:", error, data);
    }
  }

  /**
   * Handle ping messages and respond with pong
   */
  private handlePing(message: PingMessage): void {
    console.log("🏓 Received ping, sending pong");

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "pong",
          t: message.t,
        })
      );
    }
  }

  /**
   * Attempt to reconnect to WebSocket
   */
  private attemptReconnect(): void {
    this.reconnectAttempts++;
    console.log(
      `🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
    );

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error("❌ Reconnection failed:", error);
      });
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    console.log("🔌 Disconnecting WebSocket...");

    this.cleanup();

    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  // Event handler setters
  onSnapshot(handler: (data: SnapshotMessage) => void) {
    this.onSnapshotHandler = handler;
  }

  onPoolAdded(handler: (data: PoolAddedMessage) => void) {
    this.onPoolAddedHandler = handler;
  }

  onPoolRemoved(handler: (data: PoolRemovedMessage) => void) {
    this.onPoolRemovedHandler = handler;
  }

  onPoolClosed(handler: (data: PoolClosedMessage) => void) {
    this.onPoolClosedHandler = handler;
  }

  onPoolResolved(handler: (data: PoolResolvedMessage) => void) {
    this.onPoolResolvedHandler = handler;
  }

  onOutcomeAdded(handler: (data: OutcomeAddedMessage) => void) {
    this.onOutcomeAddedHandler = handler;
  }

  onOutcomeUpdated(handler: (data: OutcomeUpdatedMessage) => void) {
    this.onOutcomeUpdatedHandler = handler;
  }

  onBetCreated(handler: (data: BetCreatedMessage) => void) {
    this.onBetCreatedHandler = handler;
  }

  onBetConfirmed(handler: (data: BetConfirmedMessage) => void) {
    this.onBetConfirmedHandler = handler;
  }

  onConnection(handler: (connected: boolean) => void) {
    this.onConnectionHandler = handler;
  }
}

/**
 * Combined client for both REST API and WebSocket
 * Provides a unified interface for all BananaZone operations
 */
export class BananaZoneClient {
  private api: BananaZoneAPI;
  private ws: BananaZoneWebSocket | null = null;
  private jwt: string;

  constructor(jwt: string) {
    this.jwt = jwt;
    this.api = new BananaZoneAPI();
  }

  /**
   * Get REST API client
   */
  getAPI(): BananaZoneAPI {
    return this.api;
  }

  /**
   * Connect to WebSocket for a specific competition
   */
  async connectWebSocket(competitionKey: string): Promise<BananaZoneWebSocket> {
    if (this.ws) {
      this.ws.disconnect();
    }

    this.ws = new BananaZoneWebSocket(this.jwt, competitionKey);
    await this.ws.connect();
    return this.ws;
  }

  /**
   * Get current WebSocket connection
   */
  getWebSocket(): BananaZoneWebSocket | null {
    return this.ws;
  }

  /**
   * Disconnect all connections
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.disconnect();
      this.ws = null;
    }
  }

  /**
   * Check if client is fully connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.isConnected();
  }
}

// Usage example:
/*
const client = new BananaZoneClient("your-jwt-token");

// Get competitions
const competitions = await client.getAPI().getCompetitions();

// Get active pools
const pools = await client.getAPI().getActivePools(competitions[0].competitionKey);

// Connect to WebSocket
const ws = await client.connectWebSocket(competitions[0].competitionKey);

// Set up event handlers
ws.onSnapshot((data) => {
  console.log("Initial pools:", data.pools);
});

ws.onPoolAdded((data) => {
  console.log("New pool added:", data.pool);
});

ws.onBetCreated((data) => {
  console.log("New bet created:", data.bet);
});

// Create a bet
await client.getAPI().createBet("pool-id", "outcome-id", 100, "jwt-token");

// Disconnect when done
client.disconnect();
*/
