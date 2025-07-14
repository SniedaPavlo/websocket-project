import { WebSocketConfig } from "@/types/api";
import { WebSocketClient } from "./client";

export class WebSocketService {
  private wsUrl: string;

  constructor(wsUrl: string = "wss://bananazone.app") {
    this.wsUrl = wsUrl;
  }

  createConnection(config: WebSocketConfig): WebSocketClient {
    return new WebSocketClient(config, this.wsUrl);
  }
}