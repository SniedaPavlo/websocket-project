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
  volatility: string;
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
