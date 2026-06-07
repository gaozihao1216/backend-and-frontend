import { z } from "zod";
import { request } from "./client.js";

const FriendSchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  since: z.string(),
});

const MessageSchema = z.object({
  id: z.string(),
  senderId: z.string(),
  receiverId: z.string(),
  content: z.string(),
  createdAt: z.string(),
  mine: z.boolean(),
});

const FriendListSchema = z.object({
  friends: z.array(FriendSchema),
});

const MessageListSchema = z.object({
  messages: z.array(MessageSchema),
});

export type PlayerFriend = z.infer<typeof FriendSchema>;
export type PlayerPrivateMessage = z.infer<typeof MessageSchema>;

export const listPlayerFriends = async (userId: string): Promise<PlayerFriend[]> => {
  const data = await request(
    "/player/social/friends",
    { method: "GET", headers: { "x-user-id": userId } },
    FriendListSchema,
  );
  return data.friends;
};

export const addPlayerFriend = async (userId: string, friendUserId: string): Promise<PlayerFriend[]> => {
  const data = await request(
    "/player/social/friends",
    {
      method: "POST",
      headers: { "x-user-id": userId },
      body: JSON.stringify({ friendUserId }),
    },
    FriendListSchema,
  );
  return data.friends;
};

export const listPlayerMessages = async (
  userId: string,
  withUserId: string,
): Promise<PlayerPrivateMessage[]> => {
  const params = new URLSearchParams({ withUserId });
  const data = await request(
    `/player/social/messages?${params.toString()}`,
    { method: "GET", headers: { "x-user-id": userId } },
    MessageListSchema,
  );
  return data.messages;
};

export const sendPlayerMessage = async (
  userId: string,
  receiverId: string,
  content: string,
): Promise<PlayerPrivateMessage[]> => {
  const data = await request(
    "/player/social/messages",
    {
      method: "POST",
      headers: { "x-user-id": userId },
      body: JSON.stringify({ receiverId, content }),
    },
    MessageListSchema,
  );
  return data.messages;
};
