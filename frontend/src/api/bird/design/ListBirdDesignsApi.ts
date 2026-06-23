import {
  ListBirdDesignsRequestQuerySchema,
  ListBirdDesignsResponseDataSchema,
  type BirdDesign,
  type ListBirdDesignsRequestQuery,
} from "../../api-contracts.js";
import { request } from "../../client.js";

export const ListBirdDesignsApiPath = "/designer/bird-designs" as const;

export class ListBirdDesignsApi {
  static readonly path = ListBirdDesignsApiPath;

  async execute(userId: string, options?: ListBirdDesignsRequestQuery): Promise<BirdDesign[]> {
    const query = ListBirdDesignsRequestQuerySchema.parse(options ?? {});
    const params = new URLSearchParams();
    if (query.status) params.set("status", query.status);
    const path = params.size > 0 ? `${ListBirdDesignsApi.path}?${params.toString()}` : ListBirdDesignsApi.path;
    return request(path, { method: "GET", headers: { "x-user-id": userId } }, ListBirdDesignsResponseDataSchema);
  }
}

export const listBirdDesignsApi = new ListBirdDesignsApi();
export const listBirdDesigns = async (userId: string, options?: ListBirdDesignsRequestQuery) =>
  listBirdDesignsApi.execute(userId, options);
