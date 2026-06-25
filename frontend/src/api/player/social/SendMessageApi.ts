import { MessageListSchema, type PlayerPrivateMessage } from "../../../objects/player/social/player-social.js";
import { APIWithTokenMessage } from "../../../system/api/APIWithTokenMessage.js";
import { sendAPI } from "../../../system/api/sendAPI.js";

export class SendMessageAPI extends APIWithTokenMessage<{ messages: PlayerPrivateMessage[] }> {
  readonly receiverId: string;
  readonly content: string;

  constructor(userId: string, receiverId: string, content: string) {
    super(userId);
    this.receiverId = receiverId;
    this.content = content;
  }

  override get responseSchema() {
    return MessageListSchema;
  }
}

export const sendPlayerMessage = async (userId: string, receiverId: string, content: string) =>
  (await sendAPI(new SendMessageAPI(userId, receiverId, content))).messages;
