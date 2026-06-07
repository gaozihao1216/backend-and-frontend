import {
  GetPendingBirdSubmissionsRequestQuerySchema,
  GetPendingBirdSubmissionsResponseDataSchema,
  type BirdSubmissionWithDesign,
} from "../api-contracts.js";
import { request } from "../client.js";

export const GetPendingBirdSubmissionsApiPath = "/admin/bird-submissions/pending" as const;

export class GetPendingBirdSubmissionsApi {
  static readonly path = GetPendingBirdSubmissionsApiPath;

  async execute(userId: string): Promise<BirdSubmissionWithDesign[]> {
    GetPendingBirdSubmissionsRequestQuerySchema.parse({});
    return request(
      GetPendingBirdSubmissionsApi.path,
      { method: "GET", headers: { "x-user-id": userId } },
      GetPendingBirdSubmissionsResponseDataSchema,
    );
  }
}

export const getPendingBirdSubmissionsApi = new GetPendingBirdSubmissionsApi();
export const getPendingBirdSubmissions = async (userId: string) =>
  getPendingBirdSubmissionsApi.execute(userId);
