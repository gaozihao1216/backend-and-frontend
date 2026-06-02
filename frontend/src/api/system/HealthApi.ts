import { HealthResponseSchema, type HealthResponse } from "../../objects/system/system-objects.js";
import { request } from "../client.js";

export const HealthApiPath = "/health" as const;

export const getHealth = async (): Promise<HealthResponse> =>
  request(HealthApiPath, { method: "GET" }, HealthResponseSchema);
