import { ListUiPagesRequestQuerySchema, ListUiPagesResponseDataSchema, type UiPageConfig, type UiPageEndpoint } from "../../api-contracts.js";
import { request } from "../../client.js";

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
    return request(path, { method: "GET", headers: { "x-user-id": userId } }, ListUiPagesResponseDataSchema);
  }
}

export const listUiPagesApi = new ListUiPagesApi();

export const listUiPages = async (userId: string, endpoint?: UiPageEndpoint): Promise<UiPageConfig[]> =>
  listUiPagesApi.execute(userId, endpoint);
