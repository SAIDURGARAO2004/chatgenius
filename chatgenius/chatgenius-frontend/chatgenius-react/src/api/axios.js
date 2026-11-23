import { API_URL } from "../config";
import axios from "axios";

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

// Attach JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("userToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
