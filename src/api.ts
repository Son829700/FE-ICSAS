import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token && config.url && !config.url.includes("/auth/token")) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});

export default API;