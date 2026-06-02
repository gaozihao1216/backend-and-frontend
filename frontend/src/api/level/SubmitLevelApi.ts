import { SubmitLevelRequestBodySchema, SubmitLevelResponseDataSchema, type DesignerSubmission } from "../api-contracts.js";
import { request } from "../client.js";

export const submitLevel = async (userId: string, levelId: string): Promise<DesignerSubmission> =>
  request("/designer/submissions", { method: "POST", headers: { "x-user-id": userId }, body: JSON.stringify(SubmitLevelRequestBodySchema.parse({ levelId })) }, SubmitLevelResponseDataSchema);
