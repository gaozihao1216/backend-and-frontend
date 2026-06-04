import { CreateUiPageRequestBodySchema, CreateUiPageResponseDataSchema, type UiPageConfig } from "../api-contracts.js";
import { request } from "../client.js";

export const CreateUiPageApiPath = "/admin/director/ui/pages" as const;

export class CreateUiPageApi {
  static readonly path = CreateUiPageApiPath;

  async execute(userId: string, page: UiPageConfig): Promise<UiPageConfig> {
    return request(
      CreateUiPageApi.path,
      {
        method: "POST",
        headers: { "x-user-id": userId },
        body: JSON.stringify(CreateUiPageRequestBodySchema.parse({ page })),
      },
      CreateUiPageResponseDataSchema,
    );
  }
}

export const createUiPageApi = new CreateUiPageApi();

export const createUiPage = async (userId: string, page: UiPageConfig): Promise<UiPageConfig> =>
  createUiPageApi.execute(userId, page);
