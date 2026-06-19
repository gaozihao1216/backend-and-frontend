import { request } from "../../client.js";
import { MessageListSchema, type PlayerPrivateMessage } from "./PlayerSocialSchemas.js";

export const listMessagesApiPath = (withUserId: string) =>
  `/player/social/messages?${new URLSearchParams({ withUserId }).toString()}` as const;

export class ListMessagesApi {
  path(withUserId: string): string {
    return listMessagesApiPath(withUserId);
  }

  async execute(userId: string, withUserId: string): Promise<PlayerPrivateMessage[]> {
    const data = await request(
      this.path(withUserId),
      { method: "GET", headers: { "x-user-id": userId } },
      MessageListSchema,
    );
    return data.messages;
  }
}

export const listMessagesApi = new ListMessagesApi();
export const listPlayerMessages = (userId: string, withUserId: string) =>
  listMessagesApi.execute(userId, withUserId);
