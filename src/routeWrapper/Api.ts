import axios from "axios";

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

export default Api;
