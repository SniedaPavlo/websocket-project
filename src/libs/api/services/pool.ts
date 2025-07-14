import { PoolsRequest } from "@/types/api";
import { HttpClient } from "../http";

export class PoolService {
  constructor(private http: HttpClient) {}

  async getActivePools(request: PoolsRequest): Promise<any> {
    const payload = {
      competitionKey: request.competitionKey,
      poolsPerPage: request.poolsPerPage || 10,
      secondsPerPool: request.secondsPerPool || 30,
    };

    return this.http.post("/games/pools/active/new", payload);
  }
}