import { request } from "../../client.js";
import { FriendListSchema, type PlayerFriend } from "./PlayerSocialSchemas.js";

export const ListFriendsApiPath = "/player/social/friends" as const;

export class ListFriendsApi {
  static readonly path = ListFriendsApiPath;

  async execute(userId: string): Promise<PlayerFriend[]> {
    const data = await request(
      ListFriendsApi.path,
      { method: "GET", headers: { "x-user-id": userId } },
      FriendListSchema,
    );
    return data.friends;
  }
}

export const listFriendsApi = new ListFriendsApi();
export const listPlayerFriends = (userId: string) => listFriendsApi.execute(userId);
