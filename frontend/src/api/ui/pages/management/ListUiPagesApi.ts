import { ListUiPagesRequestQuerySchema, ListUiPagesResponseDataSchema, type UiPageConfig, type UiPageEndpoint } from "../../../../objects/api/api-contracts.js";
import { request } from "../../../../system/api/legacyRequest.js";
import { normalizePageComponentIds } from "../../../../objects/ui-customization/page-config-normalizer.js";

export const ListUiPagesApiPath = "/admin/director/ui/pages" as const;

export class ListUiPagesApi {
  static readonly path = ListUiPagesApiPath;

  async execute(userId: string, endpoint?: UiPageEndpoint): Promise<UiPageConfig[]> {
    const query = ListUiPagesRequestQuerySchema.parse({ endpoint });
    const searchParams = new URLSearchParams();
    if (query.endpoint) {
      searchParams.set("endpoint", query.endpoint);
    }
    const path = searchParams.size > 0 ? `${ListUiPagesApi.path}?${searchParams.toString()}` : ListUiPagesApi.path;
    const pages = await request(path, { method: "GET", headers: { "x-user-id": userId } }, ListUiPagesResponseDataSchema);
    return pages.map(normalizePageComponentIds);
  }
}

export const listUiPagesApi = new ListUiPagesApi();

export const listUiPages = async (userId: string, endpoint?: UiPageEndpoint): Promise<UiPageConfig[]> =>
  listUiPagesApi.execute(userId, endpoint);
