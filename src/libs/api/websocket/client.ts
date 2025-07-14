import { WebSocketConfig } from "@/types/api";

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