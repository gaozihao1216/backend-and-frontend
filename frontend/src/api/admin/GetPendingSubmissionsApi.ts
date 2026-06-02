import { GetPendingSubmissionsRequestQuerySchema, GetPendingSubmissionsResponseDataSchema, type PendingSubmission } from "../api-contracts.js";
import { request } from "../client.js";

export const GetPendingSubmissionsApiPath = "/admin/submissions/pending" as const;

export const getPendingSubmissions = async (userId: string): Promise<PendingSubmission[]> => {
  GetPendingSubmissionsRequestQuerySchema.parse({});
  return request(GetPendingSubmissionsApiPath, { method: "GET", headers: { "x-user-id": userId } }, GetPendingSubmissionsResponseDataSchema);
};
