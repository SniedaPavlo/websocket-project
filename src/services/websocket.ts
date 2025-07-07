import { PriceData } from "../types";

export class SolPriceWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private onDataCallback: (data: PriceData) => void;
  private reconnectInterval: number = 5000;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;

  constructor(url: string, onData: (data: PriceData) => void) {
    this.url = url;
    this.onDataCallback = onData;
    console.log("WebSocket URL:", url);
  }

  connect(): void {
    console.log("🔌 Connecting to WebSocket...");

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log("✅ WebSocket connected");
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("📊 Received data:", data);

          if (data.c) {
            const price = parseFloat(data.c);
            const timestamp = Math.floor(Date.now() / 1000);
            console.log("✅ Parsed price:", price);
            this.onDataCallback({ timestamp, price });
          }
        } catch (error) {
          console.error("❌ Error parsing message:", error);
        }
      };

      this.ws.onclose = () => {
        console.log("❌ WebSocket disconnected");
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error("💥 WebSocket error:", error);
      };
    } catch (error) {
      console.error("💥 Failed to connect:", error);
      this.handleReconnect();
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `🔄 Reconnecting in ${this.reconnectInterval}ms (attempt ${this.reconnectAttempts})`
      );
      setTimeout(() => this.connect(), this.reconnectInterval);
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
