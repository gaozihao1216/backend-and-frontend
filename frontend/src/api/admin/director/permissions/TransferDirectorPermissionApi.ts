import { TransferDirectorPermissionRequestBodySchema, TransferDirectorPermissionResponseDataSchema, type DirectorTransferResult } from "../../../api-contracts.js";
import { request } from "../../../client.js";

export const TransferDirectorPermissionApiPath = "/admin/director/transfer" as const;

export class TransferDirectorPermissionApi {
  static readonly path = TransferDirectorPermissionApiPath;

  async execute(userId: string, targetAdminId: string): Promise<DirectorTransferResult> {
    return request(
      TransferDirectorPermissionApi.path,
      {
        method: "POST",
        headers: { "x-user-id": userId },
        body: JSON.stringify(TransferDirectorPermissionRequestBodySchema.parse({ targetAdminId })),
      },
      TransferDirectorPermissionResponseDataSchema,
    );
  }
}

export const transferDirectorPermissionApi = new TransferDirectorPermissionApi();

export const transferDirectorPermission = async (userId: string, targetAdminId: string): Promise<DirectorTransferResult> =>
  transferDirectorPermissionApi.execute(userId, targetAdminId);
