import { request } from "../../client.js";
import { MessageListSchema, type PlayerPrivateMessage } from "./PlayerSocialSchemas.js";

export const SendMessageApiPath = "/player/social/messages" as const;

export class SendMessageApi {
  static readonly path = SendMessageApiPath;

  async execute(
    userId: string,
    receiverId: string,
    content: string,
  ): Promise<PlayerPrivateMessage[]> {
    const data = await request(
      SendMessageApi.path,
      {
        method: "POST",
        headers: { "x-user-id": userId },
        body: JSON.stringify({ receiverId, content }),
      },
      MessageListSchema,
    );
    return data.messages;
  }
}

export const sendMessageApi = new SendMessageApi();
export const sendPlayerMessage = (userId: string, receiverId: string, content: string) =>
  sendMessageApi.execute(userId, receiverId, content);
