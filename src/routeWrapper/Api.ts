import axios from "axios";
import { showToast } from "../utils/Redirecttoast";

const Api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
  withCredentials: true, // 🔥 required for JWT cookies
});

// 🔐 Global auth interceptor
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
        window.location.href = "/login";
      }, 1500);
    }

    return Promise.reject(error);
  }
)

export default Api;
