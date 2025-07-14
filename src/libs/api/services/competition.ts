import { Competition } from "@/types/api";
import { HttpClient } from "../http";

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

  // Force clear cache
  clearCache(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
  }
}