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
}

export interface RequestOptions {
  jwt?: string;
  timeout?: number;
}

// =============================================================================
// HTTP CLIENT
// =============================================================================

export class HttpClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;

  constructor(config: ApiConfig = {}) {
    this.baseUrl = config.baseUrl || "https://bananazone.app/api";
    //for key headers "d4c3b4f6e2a8c9d0f1e2b3c4d5a6b7c8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b"
    this.apiKey =
      config.apiKey ||
      "d4c3b4f6e2a8c9d0f1e2b3c4d5a6b7c8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b";
    this.timeout = config.timeout || 10000;
  }

  private getHeaders(jwt?: string): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "x-banana-key": this.apiKey,
    };

    if (jwt) {
      headers["Authorization"] = `Bearer ${jwt}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    method: string = "GET",
    body?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      options.timeout || this.timeout
    );

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: this.getHeaders(options.jwt),
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, "GET", undefined, options);
  }

  async post<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, "POST", data, options);
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

  async getByKey(key: string): Promise<Competition | null> {
    const competitions = await this.getAll();
    return competitions.find((c) => c.competitionKey === key) || null;
  }

  async getActive(): Promise<Competition[]> {
    const competitions = await this.getAll();
    const now = Math.floor(Date.now() / 1000);
    return competitions.filter((c) => c.endTime > now);
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

// =============================================================================
// MAIN CLIENT
// =============================================================================

export class BananaZoneClient {
  public readonly competitions: CompetitionService;
  public readonly pools: PoolService;

  constructor(config: ApiConfig = {}) {
    const http = new HttpClient(config);

    this.competitions = new CompetitionService(http);
    this.pools = new PoolService(http);
  }

  async ping(): Promise<boolean> {
    try {
      await this.competitions.getAll();
      return true;
    } catch {
      return false;
    }
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

// Get active competitions (uses cached data)
const active = await client.competitions.getActive();

// Find a specific competition (uses cached data)
const solCompetition = await client.competitions.getByKey('5131FyiapyPHMwoLrzxNtpg13nNDvYprK5GJ2eQreaq2');

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

// Check connection
const isOnline = await client.ping();

// Custom configuration
const customClient = new BananaZoneClient({
  baseUrl: 'https://api.custom.banana.com',
  apiKey: 'your-api-key',
  timeout: 5000,
});
*/
