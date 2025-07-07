import { PriceData } from "../types";

interface HTTPServiceConfig {
  baseUrl: string;
  testDataEnabled: boolean;
}

export class SolPriceHTTP {
  private readonly config: HTTPServiceConfig;
  private readonly onDataCallback: (data: PriceData) => void;
  private polling: boolean = false;
  private abortController: AbortController | null = null;
  private buffer: string = "";

  constructor(
    onData: (data: PriceData) => void,
    config?: Partial<HTTPServiceConfig>
  ) {
    this.onDataCallback = onData;
    this.config = {
      baseUrl: "https://bananazone.app/feed/SOL_USD?from=1751876728",
      testDataEnabled: false,
      ...config,
    };
  }

  async connect(): Promise<void> {
    this.polling = true;
    try {
      await this.startStreaming();
    } catch (error) {
      // Don't start test data generation, just fail silently
      this.polling = false;
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

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No reader available");
      }

      const decoder = new TextDecoder();
      this.buffer = "";

      while (this.polling) {
        const { done, value } = await reader.read();

        if (done) {
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
      if (error instanceof Error && error.name !== "AbortError") {
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
        return;
      }

      const [timestamp, price] = parsed as [number, number];

      if (typeof timestamp !== "number" || typeof price !== "number") {
        return;
      }

      const priceData: PriceData = {
        timestamp,
        price: price / 1e8,
      };

      this.onDataCallback(priceData);
    } catch (parseError) {
      // Silent fail
    }
  }

  disconnect(): void {
    this.polling = false;

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  isConnected(): boolean {
    return this.polling;
  }
}
