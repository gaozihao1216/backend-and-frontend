import { HealthResponseSchema, type HealthResponse } from "../../objects/system/system-objects.js";
import { request } from "../client.js";

export const HealthApiPath = "/health" as const;

export class HealthApi {
  static readonly path = HealthApiPath;

  async execute(): Promise<HealthResponse> {
    return request(HealthApi.path, { method: "GET" }, HealthResponseSchema);
  }
}

export const healthApi = new HealthApi();

export const getHealth = async (): Promise<HealthResponse> =>
  healthApi.execute();
