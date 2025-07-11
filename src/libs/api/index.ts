import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

// =============================================================================
// TYPES
// =============================================================================

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

export interface PoolsRequest {
  competitionKey: string;
  poolsPerPage?: number;
  secondsPerPool?: number;
}

export interface ApiConfig {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
  wsUrl?: string;
}

export interface RequestOptions {
  jwt?: string;
  timeout?: number;
}

export interface WebSocketConfig {
  feed: string;
  from?: number;
}

// =============================================================================
// HTTP CLIENT
// =============================================================================

export class HttpClient {
  private readonly axiosInstance: AxiosInstance;
  private readonly apiKey: string;

  constructor(config: ApiConfig = {}) {
    this.apiKey =
      config.apiKey ||
      "d4c3b4f6e2a8c9d0f1e2b3c4d5a6b7c8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b";

    this.axiosInstance = axios.create({
      baseURL: config.baseUrl || "https://bananazone.app/api",
      timeout: config.timeout || 10000,
      headers: {
        "Content-Type": "application/json",
        "x-banana-key": this.apiKey,
      },
    });

    // Request interceptor for adding JWT token
    this.axiosInstance.interceptors.request.use((config) => {
      return config;
    });

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          // Server returned an error
          throw new Error(
            `HTTP ${error.response.status}: ${error.response.statusText}`
          );
        } else if (error.request) {
          // Request was sent but no response received
          throw new Error("Network error: No response received");
        } else {
          // Other errors
          throw new Error(`Request error: ${error.message}`);
        }
      }
    );
  }

  private getRequestConfig(options: RequestOptions = {}): AxiosRequestConfig {
    const config: AxiosRequestConfig = {};

    if (options.jwt) {
      config.headers = {
        Authorization: `Bearer ${options.jwt}`,
      };
    }

    if (options.timeout) {
      config.timeout = options.timeout;
    }

    return config;
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const config = this.getRequestConfig(options);
    const response: AxiosResponse<T> = await this.axiosInstance.get(
      endpoint,
      config
    );
    return response.data;
  }

  async post<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    const config = this.getRequestConfig(options);
    const response: AxiosResponse<T> = await this.axiosInstance.post(
      endpoint,
      data,
      config
    );
    return response.data;
  }

  async put<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    const config = this.getRequestConfig(options);
    const response: AxiosResponse<T> = await this.axiosInstance.put(
      endpoint,
      data,
      config
    );
    return response.data;
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const config = this.getRequestConfig(options);
    const response: AxiosResponse<T> = await this.axiosInstance.delete(
      endpoint,
      config
    );
    return response.data;
  }
}

// =============================================================================
// WEBSOCKET CLIENT
// =============================================================================

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private wsUrl: string;

  constructor(
    config: WebSocketConfig,
    baseUrl: string = "wss://bananazone.app"
  ) {
    const params = new URLSearchParams();
    if (config.from) {
      params.append("from", config.from.toString());
    }

    const queryString = params.toString();
    const separator = queryString ? "?" : "";

    this.wsUrl = `${baseUrl}/ws/feed/${config.feed}${separator}${queryString}`;
  }

  connect(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => resolve(this.ws!);
      this.ws.onerror = (error) => reject(error);
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  onMessage(handler: (data: any) => void): void {
    if (this.ws) {
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handler(data);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };
    }
  }
}

// =============================================================================
// API SERVICES
// =============================================================================

export class CompetitionService {
  private cache: Competition[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  constructor(private http: HttpClient) {}

  async getAll(forceRefresh: boolean = false): Promise<Competition[]> {
    const now = Date.now();

    // Check cache
    if (
      !forceRefresh &&
      this.cache &&
      now - this.cacheTimestamp < this.CACHE_DURATION
    ) {
      return this.cache;
    }

    // Make request and cache result
    this.cache = await this.http.get<Competition[]>("/competition");
    this.cacheTimestamp = now;

    return this.cache;
  }

  // Force clear cache
  clearCache(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
  }
}

export class PoolService {
  constructor(private http: HttpClient) {}

  async getActivePools(request: PoolsRequest): Promise<any> {
    const payload = {
      competitionKey: request.competitionKey,
      poolsPerPage: request.poolsPerPage || 10,
      secondsPerPool: request.secondsPerPool || 30,
    };

    return this.http.post("/games/pools/active/new", payload);
  }
}

export class WebSocketService {
  private wsUrl: string;

  constructor(wsUrl: string = "wss://bananazone.app") {
    this.wsUrl = wsUrl;
  }

  createConnection(config: WebSocketConfig): WebSocketClient {
    return new WebSocketClient(config, this.wsUrl);
  }
}

// =============================================================================
// MAIN CLIENT
// =============================================================================

export class BananaZoneClient {
  public readonly competitions: CompetitionService;
  public readonly pools: PoolService;
  public readonly websocket: WebSocketService;

  constructor(config: ApiConfig = {}) {
    const http = new HttpClient(config);

    this.competitions = new CompetitionService(http);
    this.pools = new PoolService(http);
    this.websocket = new WebSocketService(config.wsUrl);
  }
}

// =============================================================================
// USAGE
// =============================================================================

/*
// Basic usage
const client = new BananaZoneClient();

// Get all competitions (will use cache if available)
const competitions = await client.competitions.getAll();

// Force refresh cache
const freshCompetitions = await client.competitions.getAll(true);

// Clear cache manually
client.competitions.clearCache();

// Get active pools for a competition
const pools = await client.pools.getActivePools({
  competitionKey: '5131FyiapyPHMwoLrzxNtpg13nNDvYprK5GJ2eQreaq2',
  poolsPerPage: 10,
  secondsPerPool: 30
});

// WebSocket usage
const wsClient = client.websocket.createConnection({
  feed: 'SOL_USD',
  from: 1752142863
});

// Connect and handle messages
const ws = await wsClient.connect();

wsClient.onMessage((data) => {
  console.log('Received:', data);
});

// Disconnect when done
wsClient.disconnect();

// Custom configuration
const customClient = new BananaZoneClient({
  baseUrl: 'https://api.custom.banana.com',
  wsUrl: 'wss://ws.custom.banana.com',
  apiKey: 'your-api-key',
  timeout: 5000,
});
*/
