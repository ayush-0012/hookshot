import axios from "axios";

import { env } from "@/env";
import { getClerkAuthToken } from "@/utils/clerk-auth";

export const api = axios.create({
  baseURL: env.NEXT_PUBLIC_SERVER_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const token = await getClerkAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
