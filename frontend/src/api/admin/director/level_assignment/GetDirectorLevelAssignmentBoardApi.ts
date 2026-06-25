import {
  DirectorLevelAssignmentBoardSchema,
  type DirectorLevelAssignmentBoard,
} from "../../../../objects/admin/director/level_assignment/board/director-level-assignment-board.js"
// board schemas;
import { request } from "../../../../system/api/legacyRequest.js";

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
