import axios from "axios";
import { showToast } from "../utils/Redirecttoast";

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

// � Add Authorization header from localStorage (fallback for iOS)
Api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// �🔐 Global auth interceptor
Api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      const code = error.response?.data?.code;

      if (code === "LOGGED_IN_ELSEWHERE") {
        showToast("Your account was logged in from another device.", {
          title: "Security Alert",
          duration: 2000,
        });
      }

      if (code === "SESSION_EXPIRED") {
        showToast("Your session expired. Please login again.", {
          title: "Session Ended",
          duration: 2000,
        });
      }

      // ⏳ Give the toast time to render
      setTimeout(() => {
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("authToken");
        window.location.href = "/login";
      }, 1500);
    }

    return Promise.reject(error);
  }
)

export default Api;
