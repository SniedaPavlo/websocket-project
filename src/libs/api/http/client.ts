import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { ApiConfig, RequestOptions } from "@/types/api";

export class HttpClient {
  private readonly axiosInstance: AxiosInstance;
  private readonly apiKey: string;

  constructor(config: ApiConfig = {}) {
    this.apiKey =
      config.apiKey ||
      "d4c3b4f6e2a8c9d0f1e2b3c4d5a6b7c8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b";

    this.axiosInstance = axios.create({
      baseURL: config.baseUrl || "https://bananazone.app/api",
      timeout: config.timeout || 10000,
      headers: {
        "Content-Type": "application/json",
        "x-banana-key": this.apiKey,
      },
    });

    // Request interceptor for adding JWT token
    this.axiosInstance.interceptors.request.use((config) => {
      return config;
    });

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          // Server returned an error
          throw new Error(
            `HTTP ${error.response.status}: ${error.response.statusText}`
          );
        } else if (error.request) {
          // Request was sent but no response received
          throw new Error("Network error: No response received");
        } else {
          // Other errors
          throw new Error(`Request error: ${error.message}`);
        }
      }
    );
  }

  private getRequestConfig(options: RequestOptions = {}): AxiosRequestConfig {
    const config: AxiosRequestConfig = {};

    if (options.jwt) {
      config.headers = {
        Authorization: `Bearer ${options.jwt}`,
      };
    }

    if (options.timeout) {
      config.timeout = options.timeout;
    }

    return config;
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const config = this.getRequestConfig(options);
    const response: AxiosResponse<T> = await this.axiosInstance.get(
      endpoint,
      config
    );
    return response.data;
  }

  async post<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    const config = this.getRequestConfig(options);
    const response: AxiosResponse<T> = await this.axiosInstance.post(
      endpoint,
      data,
      config
    );
    return response.data;
  }

  async put<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    const config = this.getRequestConfig(options);
    const response: AxiosResponse<T> = await this.axiosInstance.put(
      endpoint,
      data,
      config
    );
    return response.data;
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const config = this.getRequestConfig(options);
    const response: AxiosResponse<T> = await this.axiosInstance.delete(
      endpoint,
      config
    );
    return response.data;
  }
}