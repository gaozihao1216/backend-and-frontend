import { HealthResponseSchema, type HealthResponse } from "../../objects/system/system-objects.js";
import { request } from "../client.js";

export const getHealth = async (): Promise<HealthResponse> =>
  request("/health", { method: "GET" }, HealthResponseSchema);
