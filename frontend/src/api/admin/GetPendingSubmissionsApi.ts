import { GetPendingSubmissionsRequestQuerySchema, GetPendingSubmissionsResponseDataSchema, type PendingSubmission } from "../api-contracts.js";
import { request } from "../client.js";

export const getPendingSubmissions = async (userId: string): Promise<PendingSubmission[]> => {
  GetPendingSubmissionsRequestQuerySchema.parse({});
  return request("/admin/submissions/pending", { method: "GET", headers: { "x-user-id": userId } }, GetPendingSubmissionsResponseDataSchema);
};
