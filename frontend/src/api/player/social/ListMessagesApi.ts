import { MessageListSchema, type PlayerPrivateMessage } from "../../../objects/player/social/player-social.js";
import { APIWithTokenMessage } from "../../../system/api/APIWithTokenMessage.js";
import { sendAPI } from "../../../system/api/sendAPI.js";

export class ListMessagesAPI extends APIWithTokenMessage<{ messages: PlayerPrivateMessage[] }> {
  readonly withUserId: string;

  constructor(userId: string, withUserId: string) {
    super(userId);
    this.withUserId = withUserId;
  }

  override get responseSchema() {
    return MessageListSchema;
  }
}

export const listPlayerMessages = async (userId: string, withUserId: string) =>
  (await sendAPI(new ListMessagesAPI(userId, withUserId))).messages;
