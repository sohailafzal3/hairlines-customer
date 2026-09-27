import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { kBaseUrl } from '../constants';
import { Storage } from '../utils/storage';

// Standard API Response Envelope
export interface ApiResponse<T = any> {
  response: number;
  success: boolean;
  message: string;
  data: T;
  error: string;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: kBaseUrl,
      timeout: 40000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      // For cookie-based auth
      withCredentials: true,
    });

    this.client.interceptors.request.use(
      async (config) => {
        // Load any stored cookies or headers if needed
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        const { data } = response;
        if (data.success) {
          return { ...response, data: data.data };
        }
        // Business logic error
        if (data.message) {
          return Promise.reject(new Error(data.message));
        }
        return Promise.reject(new Error(data.error || 'Unknown error'));
      },
      (error) => {
        if (error.response?.data?.message) {
          return Promise.reject(new Error(error.response.data.message));
        }
        if (error.response?.data?.error) {
          return Promise.reject(new Error(error.response.data.error));
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data as T;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data as T;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data as T;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data as T;
  }

  async uploadFile<T = any>(
    url: string,
    formData: FormData,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data as T;
  }

  getInstance(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient();
