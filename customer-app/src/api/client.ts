import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { kBaseUrl } from '../constants';
import { Storage } from '../utils/storage';

import { Platform } from 'react-native';
import {
  loadCookies,
  saveCookiesFromResponse,
  cookieHeader,
} from '../utils/cookies';

export interface ApiResponse<T = any> {
  response: number;
  success: boolean | number;
  message: string;
  data: T;
  error: string;
}

const authCookieEndpoints = [
  'sign-in/verify-verification-code',
  'sign-up/verify-verification-code',
  'user/basic-info',
  'sign-in',
  'sign-up/guest',
  'auth/facebook',
  'auth/apple',
];

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
        if (Platform.OS !== 'web') {
          const cookies = await loadCookies();
          if (cookies.length > 0) {
            config.headers = config.headers ?? {};
            config.headers.Cookie = cookieHeader(cookies);
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      async (response: AxiosResponse<ApiResponse>) => {
        // Automatically save cookies from ANY response with set-cookie
        const setCookie = response.headers['set-cookie'];
        if (setCookie) {
          await saveCookiesFromResponse(setCookie);
        }

        const { data } = response;
        if (data) {
          // Explicit business logic failure from backend
          if (data.success === 0 || data.success === false || (data as any).status === false) {
            const errorMsg = data.message || data.error || 'Request failed';
            return Promise.reject(new Error(errorMsg));
          }

          // Explicit business logic success
          if (
            data.success === true ||
            (data as any).success === 1 ||
            (data as any).success === '1' ||
            (data as any).response === 1
          ) {
            return { ...response, data: data.data !== undefined ? data.data : data };
          }

          // Direct data payload without standard envelope
          if (data.data !== undefined) {
            return { ...response, data: data.data };
          }

          return response;
        }

        return response;
      },
      (error) => {
        const setCookie = error.response?.headers?.['set-cookie'];
        if (setCookie) {
          saveCookiesFromResponse(setCookie);
        }

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
