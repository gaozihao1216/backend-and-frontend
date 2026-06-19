import {
  DeleteBirdDesignResponseDataSchema,
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

/** 与后端 ListBirdDesignsApi.scala 中的 DeleteBirdDesignAPIMessage 同文件维护。 */
export class DeleteBirdDesignApi {
  static path(designId: string) {
    return `/designer/bird-designs/${encodeURIComponent(designId)}` as const;
  }

  async execute(userId: string, designId: string): Promise<BirdDesign> {
    return request(
      DeleteBirdDesignApi.path(designId),
      { method: "DELETE", headers: { "x-user-id": userId } },
      DeleteBirdDesignResponseDataSchema,
    );
  }
}

export const deleteBirdDesignApi = new DeleteBirdDesignApi();
export const deleteBirdDesign = async (userId: string, designId: string) =>
  deleteBirdDesignApi.execute(userId, designId);
