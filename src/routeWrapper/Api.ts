import axios from "axios";
import type { AxiosError } from "axios";
import { store } from "../store/store";
import { clearUserProfile } from "../store/slices/userSlice";
import { getActiveAccountId } from "../utils/indexedDB/tilesDB";

// In production, use relative URL (goes through Vercel rewrites to same domain)
// In development, use local backend
const isProduction = import.meta.env.PROD;
const API_BASE_URL = isProduction 
  ? "" // Empty string = relative URL, goes through /api/* rewrite
  : (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000");

const Api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // 🔥 required for JWT cookies
});

let isRedirectingToLogin = false;

const isAuthRoute = (url?: string) => {
  if (!url) return false;
  return ["/api/auth/login", "/api/auth/signup", "/api/auth/forgot-password", "/api/auth/reset-password"].some((path) => url.includes(path));
};

Api.interceptors.request.use((config) => {
  const accountId = getActiveAccountId();
  if (accountId && !isAuthRoute(config.url)) {
    if (!config.headers.has("X-Account-Id")) config.headers.set("X-Account-Id", accountId);
  }
  return config;
});

const shouldForceLogout = (error: AxiosError<{ code?: string; message?: string }>) => {
  const status = error.response?.status;
  if (status !== 401) return false;

  const code = error.response?.data?.code;
  if (code && ["SESSION_EXPIRED", "INVALID_TOKEN", "NO_TOKEN", "AUTH_FAILED"].includes(code)) {
    return true;
  }

  const message = (error.response?.data?.message || "").toLowerCase();
  return message.includes("not authenticated");
};

Api.interceptors.response.use(
  (response) => {
    const requestAccount = response.config.headers.get("X-Account-Id");
    if (requestAccount && requestAccount !== getActiveAccountId()) {
      return Promise.reject(new Error("Account changed while request was in progress"));
    }
    return response;
  },
  (error: AxiosError<{ code?: string; message?: string }>) => {
    if (!navigator.onLine) return Promise.reject(error);

    const requestUrl = error.config?.url;

    const requestAccount = error.config?.headers?.get("X-Account-Id");
    if (requestAccount && requestAccount !== getActiveAccountId()) return Promise.reject(error);

    if (!isAuthRoute(requestUrl) && (shouldForceLogout(error) || error.response?.data?.code === "ACCOUNT_MISMATCH")) {
      store.dispatch(clearUserProfile());

      if (!isRedirectingToLogin && window.location.pathname !== "/login") {
        isRedirectingToLogin = true;
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  }
);

export default Api;
