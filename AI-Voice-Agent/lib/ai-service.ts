import axios from "axios";
import { env } from "@/lib/env";

export const aiService = axios.create({
  baseURL: env.AI_SERVICE_URL,
  timeout: 120000,
  headers: env.AI_SERVICE_API_KEY ? { "x-service-key": env.AI_SERVICE_API_KEY } : undefined,
});
