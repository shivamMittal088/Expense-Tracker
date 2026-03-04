import axios from "axios";
import type { AxiosError } from "axios";
import { store } from "../store/store";
import { clearUserProfile } from "../store/slices/userSlice";

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
  return ["/api/auth/login", "/api/auth/signup"].some((path) => url.includes(path));
};

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
  (response) => response,
  (error: AxiosError<{ code?: string; message?: string }>) => {
    const requestUrl = error.config?.url;

    if (!isAuthRoute(requestUrl) && shouldForceLogout(error)) {
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
