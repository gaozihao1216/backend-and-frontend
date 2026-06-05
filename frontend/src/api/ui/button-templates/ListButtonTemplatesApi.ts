import { ListButtonTemplatesResponseDataSchema, type UiButtonTemplate } from "../../api-contracts.js";
import { request } from "../../client.js";

export const ListButtonTemplatesApiPath = "/admin/director/ui/button-templates" as const;

export class ListButtonTemplatesApi {
  static readonly path = ListButtonTemplatesApiPath;

  async execute(userId: string): Promise<UiButtonTemplate[]> {
    return request(ListButtonTemplatesApi.path, { method: "GET", headers: { "x-user-id": userId } }, ListButtonTemplatesResponseDataSchema);
  }
}

export const listButtonTemplatesApi = new ListButtonTemplatesApi();

export const listButtonTemplates = async (userId: string): Promise<UiButtonTemplate[]> =>
  listButtonTemplatesApi.execute(userId);
