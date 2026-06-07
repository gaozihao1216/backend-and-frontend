import {
  AbolishDirectorSubmissionRequestBodySchema,
  AssignLevelSlotRequestBodySchema,
  DirectorLevelAssignmentBoardSchema,
  LevelSlotAssignmentDetailSchema,
  LevelSlotAssignmentSchema,
  type AbolishDirectorSubmissionRequestBody,
  type AssignLevelSlotRequestBody,
  type DirectorLevelAssignmentBoard,
  type LevelSlotAssignment,
  type LevelSlotAssignmentDetail,
} from "../../objects/admin/level-slot-assignment.js";
import { SubmissionWithLevelSchema, type SubmissionWithLevel } from "../../objects/level/submission-with-level.js";
import { request } from "../client.js";

export const GetDirectorLevelAssignmentBoardApiPath = "/admin/director/level-assignments/board" as const;

export class GetDirectorLevelAssignmentBoardApi {
  static readonly path = GetDirectorLevelAssignmentBoardApiPath;

  async execute(userId: string): Promise<DirectorLevelAssignmentBoard> {
    return request(
      GetDirectorLevelAssignmentBoardApi.path,
      { method: "GET", headers: { "x-user-id": userId } },
      DirectorLevelAssignmentBoardSchema,
    );
  }
}

export const getDirectorLevelAssignmentBoardApi = new GetDirectorLevelAssignmentBoardApi();

export const getDirectorLevelAssignmentBoard = async (userId: string): Promise<DirectorLevelAssignmentBoard> =>
  getDirectorLevelAssignmentBoardApi.execute(userId);

export class AssignLevelSlotApi {
  static pathFor(levelSuffix: string) {
    return `/admin/director/level-assignments/${encodeURIComponent(levelSuffix)}` as const;
  }

  async execute(
    userId: string,
    levelSuffix: string,
    body: AssignLevelSlotRequestBody,
  ): Promise<LevelSlotAssignmentDetail> {
    AssignLevelSlotRequestBodySchema.parse(body);
    return request(
      AssignLevelSlotApi.pathFor(levelSuffix),
      {
        method: "POST",
        headers: { "x-user-id": userId, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      LevelSlotAssignmentDetailSchema,
    );
  }
}

export const assignLevelSlotApi = new AssignLevelSlotApi();

export const assignLevelSlot = async (
  userId: string,
  levelSuffix: string,
  body: AssignLevelSlotRequestBody,
): Promise<LevelSlotAssignmentDetail> => assignLevelSlotApi.execute(userId, levelSuffix, body);

export class UnassignLevelSlotApi {
  static pathFor(levelSuffix: string) {
    return `/admin/director/level-assignments/${encodeURIComponent(levelSuffix)}` as const;
  }

  async execute(userId: string, levelSuffix: string): Promise<LevelSlotAssignment> {
    return request(
      UnassignLevelSlotApi.pathFor(levelSuffix),
      { method: "DELETE", headers: { "x-user-id": userId } },
      LevelSlotAssignmentSchema,
    );
  }
}

export const unassignLevelSlotApi = new UnassignLevelSlotApi();

export const unassignLevelSlot = async (userId: string, levelSuffix: string): Promise<LevelSlotAssignment> =>
  unassignLevelSlotApi.execute(userId, levelSuffix);

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
