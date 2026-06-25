import { z } from "zod";

export const FriendSchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  since: z.string(),
});

export const MessageSchema = z.object({
  id: z.string(),
  senderId: z.string(),
  receiverId: z.string(),
  content: z.string(),
  createdAt: z.string(),
  mine: z.boolean(),
});

export const FriendListSchema = z.object({
  friends: z.array(FriendSchema),
});

export const MessageListSchema = z.object({
  messages: z.array(MessageSchema),
});

export type PlayerFriend = z.infer<typeof FriendSchema>;
export type PlayerPrivateMessage = z.infer<typeof MessageSchema>;
