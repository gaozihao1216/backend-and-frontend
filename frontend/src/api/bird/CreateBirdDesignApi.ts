import {
  CreateBirdDesignRequestBodySchema,
  CreateBirdDesignResponseDataSchema,
  type BirdDesign,
  type CreateBirdDesignRequestBody,
} from "../api-contracts.js";
import { request } from "../client.js";

export const CreateBirdDesignApiPath = "/designer/bird-designs" as const;

export class CreateBirdDesignApi {
  static readonly path = CreateBirdDesignApiPath;

  async execute(userId: string, input: CreateBirdDesignRequestBody): Promise<BirdDesign> {
    const body = CreateBirdDesignRequestBodySchema.parse(input);
    return request(
      CreateBirdDesignApi.path,
      {
        method: "POST",
        headers: { "x-user-id": userId },
        body: JSON.stringify(body),
      },
      CreateBirdDesignResponseDataSchema,
    );
  }
}

export const createBirdDesignApi = new CreateBirdDesignApi();
export const createBirdDesign = async (userId: string, input: CreateBirdDesignRequestBody) =>
  createBirdDesignApi.execute(userId, input);
