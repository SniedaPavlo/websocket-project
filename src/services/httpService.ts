import { PriceData } from "../types";

export class SolPriceHTTP {
  private readonly url = "https://bananazone.app/feed/SOL_USD?from=1751876728";
  private readonly onData: (data: PriceData) => void;
  private polling = false;
  private controller: AbortController | null = null;
  private buffer = "";

  constructor(onData: (data: PriceData) => void) {
    this.onData = onData;
  }

  async connect(): Promise<void> {
    this.polling = true;
    try {
      await this.stream();
    } catch {
      this.polling = false;
    }
  }

  private async stream(): Promise<void> {
    this.controller = new AbortController();
    const response = await fetch(this.url, {
      headers: { Accept: "application/stream+json" },
      signal: this.controller.signal,
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No reader");

    const decoder = new TextDecoder();
    this.buffer = "";

    try {
      while (this.polling) {
        const { done, value } = await reader.read();
        if (done) break;

        this.buffer += decoder.decode(value, { stream: true });
        this.processBuffer();
      }
    } finally {
      reader.releaseLock();
    }
  }

  private processBuffer(): void {
    const lines = this.buffer.split("\n");
    this.buffer = lines.pop() || "";

    lines.forEach(line => {
      if (line.trim()) this.parseLine(line.trim());
    });
  }

  private parseLine(line: string): void {
    try {
      const data = JSON.parse(line);
      if (Array.isArray(data) && data.length === 2) {
        const [timestamp, price] = data;
        if (typeof timestamp === "number" && typeof price === "number") {
          this.onData({ timestamp, price: price / 1e8 });
        }
      }
    } catch {
      // Silent fail
    }
  }

  disconnect(): void {
    this.polling = false;
    this.controller?.abort();
    this.controller = null;
  }

  isConnected(): boolean {
    return this.polling;
  }
}
