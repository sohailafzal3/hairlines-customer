import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { kBaseUrl } from '../constants';
import { CookieManager } from '../utils/cookies';

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
        config.headers = config.headers || {};

        // 1. React Native does not automatically persist/send cookies.
        // Load any cookies the server previously set and send them back.
        const cookieHeader = await CookieManager.getCookieHeader();
        if (cookieHeader) {
          config.headers.Cookie = cookieHeader;
        }

        // 2. Fallback Auth Header: Read auth state from AsyncStorage
        try {
          const authStorageStr = await AsyncStorage.getItem('auth-storage');
          if (authStorageStr) {
            const parsed = JSON.parse(authStorageStr);
            const state = parsed?.state;
            const token =
              state?.token ||
              state?.account?.id ||
              state?.account?.userAccountId ||
              state?.user?.id;

            if (token) {
              if (!config.headers.Authorization) {
                config.headers.Authorization = `Bearer ${token}`;
              }
              config.headers['x-access-token'] = token;
              config.headers['user-id'] = state?.account?.id || state?.user?.id || '';

              // If Cookie header is missing or lacks session, inject token cookie
              if (!cookieHeader) {
                config.headers.Cookie = `sessionId=${token}; token=${token}`;
              }
            }
          }
        } catch (e) {
          // Ignore storage read error
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      async (response: AxiosResponse<ApiResponse>) => {
        // Capture session cookies (e.g. connect.sid / sessionId) from the
        // response so they can be sent with subsequent authenticated requests.
        await CookieManager.setCookieFromHeader(response.headers['set-cookie']);

        const { data } = response;

        // Fallback: some endpoints return the session identifier in the
        // response body. Store it as a cookie so it is sent with future calls.
        await captureSessionIdFromData(data.data);

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

/**
 * If the server returns the session identifier inside the response payload
 * (e.g. `{ sessionId: "..." }`) instead of a `Set-Cookie` header, store it
 * as a cookie so it is sent with every subsequent request.
 */
async function captureSessionIdFromData(data: any): Promise<void> {
  if (!data || typeof data !== 'object') return;

  const sessionIdFields = ['sessionId', 'sessionID', 'session_id', 'sid', 'token'];
  for (const field of sessionIdFields) {
    const value = data[field];
    if (value && typeof value === 'string') {
      await CookieManager.setCookieFromHeader(`${field}=${value}`);
      return;
    }
  }
}
