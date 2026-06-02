import { SubmitLevelRequestBodySchema, SubmitLevelResponseDataSchema, type DesignerSubmission } from "../api-contracts.js";
import { request } from "../client.js";

export const SubmitLevelApiPath = "/designer/submissions" as const;

export const submitLevel = async (userId: string, levelId: string): Promise<DesignerSubmission> =>
  request(SubmitLevelApiPath, { method: "POST", headers: { "x-user-id": userId }, body: JSON.stringify(SubmitLevelRequestBodySchema.parse({ levelId })) }, SubmitLevelResponseDataSchema);
