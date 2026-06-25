import { DirectorBirdSkillBoardSchema } from "../../../../objects/bird/skill/director/director-bird-skill-entry.js";
import { request } from "../../../../system/api/legacyRequest.js";

export class GetDirectorBirdSkillApi {
  static pathFor(birdType: string) {
    return `/admin/director/bird-skills/${encodeURIComponent(birdType)}` as const;
  }

  async execute(userId: string, birdType: string) {
    return request(
      GetDirectorBirdSkillApi.pathFor(birdType),
      { method: "GET", headers: { "x-user-id": userId } },
      DirectorBirdSkillBoardSchema.shape.birds.element,
    );
  }
}

export const getDirectorBirdSkillApi = new GetDirectorBirdSkillApi();

export const getDirectorBirdSkill = async (userId: string, birdType: string) =>
  getDirectorBirdSkillApi.execute(userId, birdType);
