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
    console.log("🔌 Starting HTTP stream to:", this.url);
    this.controller = new AbortController();
    const response = await fetch(this.url, {
      headers: { Accept: "application/stream+json" },
      signal: this.controller.signal,
    });

    console.log("📡 Response status:", response.status);
    console.log("📡 Response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No reader");

    const decoder = new TextDecoder();
    this.buffer = "";

    try {
      while (this.polling) {
        const { done, value } = await reader.read();
        if (done) {
          console.log("🏁 Stream ended");
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        console.log("📥 Raw chunk received:", chunk);
        this.buffer += chunk;
        this.processBuffer();
      }
    } finally {
      reader.releaseLock();
    }
  }

  private processBuffer(): void {
    const lines = this.buffer.split("\n");
    this.buffer = lines.pop() || "";

    console.log("📝 Processing buffer, found", lines.length, "lines");
    console.log("📝 Complete lines:", lines);

    lines.forEach(line => {
      if (line.trim()) {
        console.log("🔍 Processing line:", line.trim());
        this.parseLine(line.trim());
      }
    });
  }

  private parseLine(line: string): void {
    try {
      console.log("🧮 Parsing JSON:", line);
      const data = JSON.parse(line);
      console.log("✅ Parsed data:", data);
      
      if (Array.isArray(data) && data.length === 2) {
        const [timestamp, price] = data;
        console.log("📊 Raw values - timestamp:", timestamp, "price:", price);
        
        if (typeof timestamp === "number" && typeof price === "number") {
          const normalizedPrice = price / 1e8;
          console.log("💰 Normalized price:", normalizedPrice);
          
          const priceData = { timestamp, price: normalizedPrice };
          console.log("📈 Sending to callback:", priceData);
          
          this.onData(priceData);
        } else {
          console.warn("⚠️ Invalid data types:", { timestamp: typeof timestamp, price: typeof price });
        }
      } else {
        console.warn("⚠️ Invalid data format:", data);
      }
    } catch (error) {
      console.error("❌ JSON parse error:", error, "for line:", line);
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
