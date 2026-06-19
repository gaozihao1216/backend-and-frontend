import { CreateLevelRequestBodySchema, CreateLevelResponseDataSchema, type CreateLevelRequestBody, type DesignerLevel } from "../../api-contracts.js";
import { request } from "../../client.js";

export const CreateLevelApiPath = "/designer/levels" as const;

export class CreateLevelApi {
  static readonly path = CreateLevelApiPath;

  async execute(userId: string, input: CreateLevelRequestBody): Promise<DesignerLevel> {
    return request(
      CreateLevelApi.path,
      { method: "POST", headers: { "x-user-id": userId }, body: JSON.stringify(CreateLevelRequestBodySchema.parse(input)) },
      CreateLevelResponseDataSchema,
    );
  }
}

export const createLevelApi = new CreateLevelApi();

export const createLevel = async (userId: string, input: CreateLevelRequestBody): Promise<DesignerLevel> =>
  createLevelApi.execute(userId, input);
