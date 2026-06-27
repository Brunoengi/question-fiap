import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  headers: { "Content-Type": "application/json" },
});

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        isRefreshing = false;
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post<RefreshResponse>(
          `${api.defaults.baseURL}/auth/refresh`,
          { refreshToken }
        );

        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

        processQueue(null, data.accessToken);

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
