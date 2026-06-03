import { GetDirectorPermissionsRequestQuerySchema, GetDirectorPermissionsResponseDataSchema, type DirectorPermissionSummary } from "../api-contracts.js";
import { request } from "../client.js";

export const GetDirectorPermissionsApiPath = "/admin/director/permissions" as const;

export const getDirectorPermissions = async (userId: string): Promise<DirectorPermissionSummary> => {
  GetDirectorPermissionsRequestQuerySchema.parse({});
  return request(GetDirectorPermissionsApiPath, { method: "GET", headers: { "x-user-id": userId } }, GetDirectorPermissionsResponseDataSchema);
};
