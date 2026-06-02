import { CreateLevelRequestBodySchema, CreateLevelResponseDataSchema, type CreateLevelRequestBody, type DesignerLevel } from "../api-contracts.js";
import { request } from "../client.js";

export const CreateLevelApiPath = "/designer/levels" as const;

export const createLevel = async (userId: string, input: CreateLevelRequestBody): Promise<DesignerLevel> =>
  request(CreateLevelApiPath, { method: "POST", headers: { "x-user-id": userId }, body: JSON.stringify(CreateLevelRequestBodySchema.parse(input)) }, CreateLevelResponseDataSchema);
