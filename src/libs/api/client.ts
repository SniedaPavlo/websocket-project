import { ApiConfig } from "@/types/api";
import { HttpClient } from "./http";
import { WebSocketService } from "./websocket";
import { CompetitionService, PoolService } from "./services";

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