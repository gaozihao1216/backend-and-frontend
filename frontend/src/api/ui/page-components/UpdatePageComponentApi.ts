import { UpdatePageComponentRequestBodySchema, UpdatePageComponentRequestParamsSchema, UpdatePageComponentResponseDataSchema, type UiPageComponent, type UiPageConfig } from "../../api-contracts.js";
import { request } from "../../client.js";
import { normalizePageComponentIds } from "../../../objects/ui-customization/page-config-normalizer.js";

export const UpdatePageComponentApiPath = "/admin/director/ui/pages" as const;

export class UpdatePageComponentApi {
  static readonly path = UpdatePageComponentApiPath;

  async execute(userId: string, pageId: string, componentId: string, component: UiPageComponent): Promise<UiPageConfig> {
    const params = UpdatePageComponentRequestParamsSchema.parse({ pageId, componentId });
    const page = await request(
      `${UpdatePageComponentApi.path}/${encodeURIComponent(params.pageId)}/components/${encodeURIComponent(params.componentId)}`,
      {
        method: "PUT",
        headers: { "x-user-id": userId },
        body: JSON.stringify(UpdatePageComponentRequestBodySchema.parse({ component })),
      },
      UpdatePageComponentResponseDataSchema,
    );
    return normalizePageComponentIds(page);
  }
}

export const updatePageComponentApi = new UpdatePageComponentApi();

export const updatePageComponent = async (userId: string, pageId: string, componentId: string, component: UiPageComponent): Promise<UiPageConfig> =>
  updatePageComponentApi.execute(userId, pageId, componentId, component);
