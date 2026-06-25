import { useCallback, useEffect, useState } from "react";
import { addPlayerFriend } from "../../../../api/player/social/AddFriendApi.js";
import { listPlayerFriends } from "../../../../api/player/social/ListFriendsApi.js";
import { listPlayerMessages } from "../../../../api/player/social/ListMessagesApi.js";
import { sendPlayerMessage } from "../../../../api/player/social/SendMessageApi.js";
import type { PlayerFriend, PlayerPrivateMessage } from "../../../../objects/player/social/player-social.js";

export const usePlayerSocial = (userId: string) => {
  const [friends, setFriends] = useState<PlayerFriend[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [messages, setMessages] = useState<PlayerPrivateMessage[]>([]);
  const [friendInput, setFriendInput] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadFriends = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const nextFriends = await listPlayerFriends(userId);
      setFriends(nextFriends);
      setSelectedFriendId((current) => current ?? nextFriends[0]?.userId ?? null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "加载好友列表失败");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadFriends();
  }, [loadFriends]);

  const loadMessages = useCallback(async (friendId: string) => {
    setMessageLoading(true);
    setError("");
    try {
      const nextMessages = await listPlayerMessages(userId, friendId);
      setMessages(nextMessages);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "加载聊天记录失败");
    } finally {
      setMessageLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!selectedFriendId) {
      setMessages([]);
      return;
    }
    void loadMessages(selectedFriendId);
  }, [loadMessages, selectedFriendId]);

  const handleAddFriend = async () => {
    const friendUserId = friendInput.trim();
    if (!friendUserId) {
      return;
    }

    setError("");
    setNotice("");
    try {
      const nextFriends = await addPlayerFriend(userId, friendUserId);
      setFriends(nextFriends);
      setFriendInput("");
      setSelectedFriendId(friendUserId);
      setNotice(`已添加好友 ${friendUserId}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "添加好友失败");
    }
  };

  const handleSendMessage = async () => {
    if (!selectedFriendId) {
      return;
    }

    const content = messageInput.trim();
    if (!content) {
      return;
    }

    setError("");
    setNotice("");
    try {
      const nextMessages = await sendPlayerMessage(userId, selectedFriendId, content);
      setMessages(nextMessages);
      setMessageInput("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "发送消息失败");
    }
  };

  const selectedFriend = friends.find((friend) => friend.userId === selectedFriendId) ?? null;

  return {
    friends,
    selectedFriend,
    selectedFriendId,
    setSelectedFriendId,
    messages,
    friendInput,
    setFriendInput,
    messageInput,
    setMessageInput,
    loading,
    messageLoading,
    error,
    notice,
    handleAddFriend,
    handleSendMessage,
  };
};
