import { CreateUiPageRequestBodySchema, CreateUiPageResponseDataSchema, type UiPageConfig } from "../../../objects/api/api-contracts.js";
import { request } from "../../../system/api/legacyRequest.js";
import { normalizePageComponentIds } from "../../../objects/ui-customization/page-config-normalizer.js";

export const CreateUiPageApiPath = "/admin/director/ui/pages" as const;

export class CreateUiPageApi {
  static readonly path = CreateUiPageApiPath;

  async execute(userId: string, page: UiPageConfig): Promise<UiPageConfig> {
    const normalizedPage = normalizePageComponentIds(page);
    const savedPage = await request(
      CreateUiPageApi.path,
      {
        method: "POST",
        headers: { "x-user-id": userId },
        body: JSON.stringify(CreateUiPageRequestBodySchema.parse({ page: normalizedPage })),
      },
      CreateUiPageResponseDataSchema,
    );
    return normalizePageComponentIds(savedPage);
  }
}

export const createUiPageApi = new CreateUiPageApi();

export const createUiPage = async (userId: string, page: UiPageConfig): Promise<UiPageConfig> =>
  createUiPageApi.execute(userId, page);
