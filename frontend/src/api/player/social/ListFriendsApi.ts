import { FriendListSchema, type PlayerFriend } from "../../../objects/player/social/player-social.js";
import { APIWithTokenMessage } from "../../../system/api/APIWithTokenMessage.js";
import { sendAPI } from "../../../system/api/sendAPI.js";

export class ListFriendsAPI extends APIWithTokenMessage<{ friends: PlayerFriend[] }> {
  override get responseSchema() {
    return FriendListSchema;
  }
}

export const listPlayerFriends = async (userId: string) =>
  (await sendAPI(new ListFriendsAPI(userId))).friends;
