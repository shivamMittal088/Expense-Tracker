import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true, // VERY IMPORTANT for cookies
});

// 🔐 Global auth handler
api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      const code = error.response?.data?.code;

      if (code === "LOGGED_IN_ELSEWHERE") {
        alert("Your account was logged in from another device.");
      }

      if (code === "SESSION_EXPIRED") {
        alert("Your session expired. Please login again.");
      }

      // Redirect always on auth failure
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
