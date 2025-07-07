import { PriceData } from "../types";

interface StreamingResponse {
  timestamp: number;
  price: number;
}

interface HTTPServiceConfig {
  baseUrl: string;
  pollInterval: number;
  testDataEnabled: boolean;
}

export class SolPriceHTTP {
  private readonly config: HTTPServiceConfig;
  private readonly onDataCallback: (data: PriceData) => void;
  private polling: boolean = false;
  private abortController: AbortController | null = null;
  private buffer: string = "";
  private testIntervalId: NodeJS.Timeout | null = null;

  constructor(onData: (data: PriceData) => void, config?: Partial<HTTPServiceConfig>) {
    this.onDataCallback = onData;
    this.config = {
      baseUrl: "https://bananazone.app/feed/SOL_USD?from=1751876728",
      pollInterval: 1000,
      testDataEnabled: true,
      ...config
    };
    console.log("🚀 HTTP streaming service initialized");
  }

  async connect(): Promise<void> {
    console.log("🔌 Starting HTTP streaming connection...");
    this.polling = true;

    if (this.config.testDataEnabled) {
      this.generateTestData();
    }

    try {
      await this.startStreaming();
    } catch (error) {
      console.error("💥 Failed to connect:", error);
      if (this.config.testDataEnabled) {
        this.startTestDataGeneration();
      }
    }
  }

  private generateTestData(): void {
    const basePrice = 150; // Base SOL price
    let currentPrice = basePrice;

    // Generate 10 initial data points
    for (let i = 0; i < 10; i++) {
      const timestamp = Math.floor(Date.now() / 1000) - (10 - i);
      currentPrice += (Math.random() - 0.5) * 2; // Random walk

      console.log("🧪 Generated test data:", {
        timestamp,
        price: currentPrice,
      });
      this.onDataCallback({ timestamp, price: currentPrice });
    }
  }

  private async startStreaming(): Promise<void> {
    this.abortController = new AbortController();

    try {
      const response = await fetch(this.config.baseUrl, {
        method: "GET",
        headers: {
          Accept: "application/stream+json",
          "Cache-Control": "no-cache",
        },
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log("✅ Connected to streaming API");
      console.log(
        "Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No reader available");
      }

      const decoder = new TextDecoder();
      this.buffer = "";

      while (this.polling) {
        const { done, value } = await reader.read();

        if (done) {
          console.log("🏁 Stream ended");
          break;
        }

        // Decode the chunk and add to buffer
        const chunk = decoder.decode(value, { stream: true });
        this.buffer += chunk;

        // Process complete lines from buffer
        this.processBuffer();
      }

      reader.releaseLock();
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("📡 Stream aborted");
      } else {
        console.error("💥 Streaming error:", error);
        throw error;
      }
    }
  }

  private processBuffer(): void {
    const lines = this.buffer.split("\n");
    this.buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.trim()) {
        this.parsePriceLine(line.trim());
      }
    }
  }

  private parsePriceLine(line: string): void {
    try {
      const parsed = JSON.parse(line) as unknown;
      
      if (!Array.isArray(parsed) || parsed.length !== 2) {
        console.warn("⚠️ Invalid line format:", line);
        return;
      }

      const [timestamp, price] = parsed as [number, number];
      
      if (typeof timestamp !== 'number' || typeof price !== 'number') {
        console.warn("⚠️ Invalid data types:", { timestamp, price });
        return;
      }

      const streamingData: StreamingResponse = {
        timestamp,
        price: price / 1e8 // Normalize price
      };

      console.log("📊 Received price data:", {
        timestamp: streamingData.timestamp,
        originalPrice: price,
        normalizedPrice: streamingData.price,
      });

      this.onDataCallback(streamingData);
    } catch (parseError) {
      console.warn("⚠️ Failed to parse line:", line, parseError);
    }
  }

  private startTestDataGeneration(): void {
    console.log("🧪 Starting test data generation...");
    let currentPrice = 150 + (Math.random() - 0.5) * 10;

    this.testIntervalId = setInterval(() => {
      if (!this.polling) {
        this.stopTestDataGeneration();
        return;
      }

      const timestamp = Math.floor(Date.now() / 1000);
      currentPrice += (Math.random() - 0.5) * 1;

      const testData: PriceData = {
        timestamp,
        price: currentPrice,
      };

      console.log("🧪 Generated test data:", testData);
      this.onDataCallback(testData);
    }, this.config.pollInterval);
  }

  private stopTestDataGeneration(): void {
    if (this.testIntervalId) {
      clearInterval(this.testIntervalId);
      this.testIntervalId = null;
    }
  }

  disconnect(): void {
    console.log("❌ Stopping HTTP streaming");
    this.polling = false;

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    this.stopTestDataGeneration();
  }

  isConnected(): boolean {
    return this.polling;
  }
}
