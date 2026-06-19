import { UpdateUiPageRequestParamsSchema, UpdateUiPageResponseDataSchema, type UiPageConfig } from "../../api-contracts.js";
import { request } from "../../client.js";
import { normalizePageComponentIds } from "../../../objects/ui-customization/page-config-normalizer.js";

export const RollbackUiPageApiPath = "/admin/director/ui/pages" as const;

export class RollbackUiPageApi {
  static readonly path = RollbackUiPageApiPath;

  async execute(userId: string, pageId: string): Promise<UiPageConfig> {
    const params = UpdateUiPageRequestParamsSchema.parse({ pageId });
    const savedPage = await request(
      `${RollbackUiPageApi.path}/${encodeURIComponent(params.pageId)}/rollback`,
      {
        method: "POST",
        headers: { "x-user-id": userId },
      },
      UpdateUiPageResponseDataSchema,
    );
    return normalizePageComponentIds(savedPage);
  }
}

export const rollbackUiPageApi = new RollbackUiPageApi();

export const rollbackUiPage = async (userId: string, pageId: string): Promise<UiPageConfig> =>
  rollbackUiPageApi.execute(userId, pageId);
