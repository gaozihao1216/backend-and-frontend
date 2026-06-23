import {
  DirectorBirdSkillBoardSchema,
  type DirectorBirdSkillBoard,
} from "../../../../objects/bird/skill/director/director-bird-skill-entry.js";
import { request } from "../../../client.js";

export const GetDirectorBirdSkillBoardApiPath = "/admin/director/bird-skills/board" as const;

export class GetDirectorBirdSkillBoardApi {
  static readonly path = GetDirectorBirdSkillBoardApiPath;

  async execute(userId: string): Promise<DirectorBirdSkillBoard> {
    return request(
      GetDirectorBirdSkillBoardApi.path,
      { method: "GET", headers: { "x-user-id": userId } },
      DirectorBirdSkillBoardSchema,
    );
  }
}

export const getDirectorBirdSkillBoardApi = new GetDirectorBirdSkillBoardApi();

export const getDirectorBirdSkillBoard = async (userId: string): Promise<DirectorBirdSkillBoard> =>
  getDirectorBirdSkillBoardApi.execute(userId);
