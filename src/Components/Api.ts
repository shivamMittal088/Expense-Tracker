import axios from "axios";

const Api = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: true,   // 🔥 REQUIRED for JWT cookies
});

export default Api;
