import { CreatePageComponentRequestBodySchema, CreatePageComponentRequestParamsSchema, CreatePageComponentResponseDataSchema, type UiPageComponent, type UiPageConfig } from "../api-contracts.js";
import { request } from "../client.js";

export const CreatePageComponentApiPath = "/admin/director/ui/pages" as const;

export class CreatePageComponentApi {
  static readonly path = CreatePageComponentApiPath;

  async execute(userId: string, pageId: string, component: UiPageComponent): Promise<UiPageConfig> {
    const params = CreatePageComponentRequestParamsSchema.parse({ pageId });
    return request(
      `${CreatePageComponentApi.path}/${encodeURIComponent(params.pageId)}/components`,
      {
        method: "POST",
        headers: { "x-user-id": userId },
        body: JSON.stringify(CreatePageComponentRequestBodySchema.parse({ component })),
      },
      CreatePageComponentResponseDataSchema,
    );
  }
}

export const createPageComponentApi = new CreatePageComponentApi();

export const createPageComponent = async (userId: string, pageId: string, component: UiPageComponent): Promise<UiPageConfig> =>
  createPageComponentApi.execute(userId, pageId, component);
