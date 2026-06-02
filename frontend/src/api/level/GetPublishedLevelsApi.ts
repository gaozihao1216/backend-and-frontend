import { GetPublishedLevelsRequestQuerySchema, GetPublishedLevelsResponseDataSchema, type GetPublishedLevelsRequestQuery, type PublishedLevel } from "../api-contracts.js";
import { request } from "../client.js";

export const getPublishedLevels = async (userId: string, options?: GetPublishedLevelsRequestQuery): Promise<PublishedLevel[]> => {
  const query = GetPublishedLevelsRequestQuerySchema.parse(options ?? {});
  const params = new URLSearchParams();
  if (query.tag) params.set("tag", query.tag);
  if (query.sort) params.set("sort", query.sort);
  const path = params.size > 0 ? `/player/levels?${params.toString()}` : "/player/levels";
  return request(path, { method: "GET", headers: { "x-user-id": userId } }, GetPublishedLevelsResponseDataSchema);
};
