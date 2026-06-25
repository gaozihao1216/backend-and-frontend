import { FriendListSchema, type PlayerFriend } from "../../../objects/player/social/player-social.js";
import { APIWithTokenMessage } from "../../../system/api/APIWithTokenMessage.js";
import { sendAPI } from "../../../system/api/sendAPI.js";

export class AddFriendAPI extends APIWithTokenMessage<{ friends: PlayerFriend[] }> {
  readonly friendUserId: string;

  constructor(userId: string, friendUserId: string) {
    super(userId);
    this.friendUserId = friendUserId;
  }

  override get responseSchema() {
    return FriendListSchema;
  }
}

export const addPlayerFriend = async (userId: string, friendUserId: string) =>
  (await sendAPI(new AddFriendAPI(userId, friendUserId))).friends;
