import { request } from "../../client.js";
import { FriendListSchema, type PlayerFriend } from "./PlayerSocialSchemas.js";

export const AddFriendApiPath = "/player/social/friends" as const;

export class AddFriendApi {
  static readonly path = AddFriendApiPath;

  async execute(userId: string, friendUserId: string): Promise<PlayerFriend[]> {
    const data = await request(
      AddFriendApi.path,
      {
        method: "POST",
        headers: { "x-user-id": userId },
        body: JSON.stringify({ friendUserId }),
      },
      FriendListSchema,
    );
    return data.friends;
  }
}

export const addFriendApi = new AddFriendApi();
export const addPlayerFriend = (userId: string, friendUserId: string) =>
  addFriendApi.execute(userId, friendUserId);
