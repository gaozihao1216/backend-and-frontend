import { GetDirectorPermissionsRequestQuerySchema, GetDirectorPermissionsResponseDataSchema, type DirectorPermissionSummary } from "../../../../objects/api/api-contracts.js";
import { request } from "../../../../system/api/legacyRequest.js";

export const GetDirectorPermissionsApiPath = "/admin/director/permissions" as const;

export class GetDirectorPermissionsApi {
  static readonly path = GetDirectorPermissionsApiPath;

  async execute(userId: string): Promise<DirectorPermissionSummary> {
    GetDirectorPermissionsRequestQuerySchema.parse({});
    return request(GetDirectorPermissionsApi.path, { method: "GET", headers: { "x-user-id": userId } }, GetDirectorPermissionsResponseDataSchema);
  }
}

export const getDirectorPermissionsApi = new GetDirectorPermissionsApi();

export const getDirectorPermissions = async (userId: string): Promise<DirectorPermissionSummary> =>
  getDirectorPermissionsApi.execute(userId);
