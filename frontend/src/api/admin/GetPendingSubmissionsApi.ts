import { GetPendingSubmissionsRequestQuerySchema, GetPendingSubmissionsResponseDataSchema, type PendingSubmission } from "../api-contracts.js";
import { request } from "../client.js";

export const GetPendingSubmissionsApiPath = "/admin/submissions/pending" as const;

export class GetPendingSubmissionsApi {
  static readonly path = GetPendingSubmissionsApiPath;

  async execute(userId: string): Promise<PendingSubmission[]> {
    GetPendingSubmissionsRequestQuerySchema.parse({});
    return request(GetPendingSubmissionsApi.path, { method: "GET", headers: { "x-user-id": userId } }, GetPendingSubmissionsResponseDataSchema);
  }
}

export const getPendingSubmissionsApi = new GetPendingSubmissionsApi();

export const getPendingSubmissions = async (userId: string): Promise<PendingSubmission[]> =>
  getPendingSubmissionsApi.execute(userId);
