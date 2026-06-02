import { CreateLevelRequestBodySchema, CreateLevelResponseDataSchema, type CreateLevelRequestBody, type DesignerLevel } from "../api-contracts.js";
import { request } from "../client.js";

export const createLevel = async (userId: string, input: CreateLevelRequestBody): Promise<DesignerLevel> =>
  request("/designer/levels", { method: "POST", headers: { "x-user-id": userId }, body: JSON.stringify(CreateLevelRequestBodySchema.parse(input)) }, CreateLevelResponseDataSchema);
