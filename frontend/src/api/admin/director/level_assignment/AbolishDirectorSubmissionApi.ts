import {
  AbolishDirectorSubmissionRequestBodySchema,
  type AbolishDirectorSubmissionRequestBody,
} from "./body/AbolishDirectorSubmissionBody.js";
import { SubmissionWithLevelSchema, type SubmissionWithLevel } from "../../../../objects/level/submission/submission-with-level.js";
import { request } from "../../../client.js";

export class AbolishDirectorSubmissionApi {
  static pathFor(submissionId: string) {
    return `/admin/director/submissions/${encodeURIComponent(submissionId)}/abolish` as const;
  }

  async execute(
    userId: string,
    submissionId: string,
    body: AbolishDirectorSubmissionRequestBody = {},
  ): Promise<SubmissionWithLevel> {
    AbolishDirectorSubmissionRequestBodySchema.parse(body);
    return request(
      AbolishDirectorSubmissionApi.pathFor(submissionId),
      {
        method: "POST",
        headers: { "x-user-id": userId, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      SubmissionWithLevelSchema,
    );
  }
}

export const abolishDirectorSubmissionApi = new AbolishDirectorSubmissionApi();

export const abolishDirectorSubmission = async (
  userId: string,
  submissionId: string,
  body: AbolishDirectorSubmissionRequestBody = {},
): Promise<SubmissionWithLevel> => abolishDirectorSubmissionApi.execute(userId, submissionId, body);
