import { useCallback, useEffect, useRef, useState } from "react";
import {
  addPlayerFriend,
  listPlayerFriends,
  listPlayerMessages,
  sendPlayerMessage,
  type PlayerFriend,
  type PlayerPrivateMessage,
} from "../api/player-social-api.js";

type PlayerSocialPageProps = {
  userId: string;
};

export const PlayerSocialPage = ({ userId }: PlayerSocialPageProps) => {
  const [friends, setFriends] = useState<PlayerFriend[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [messages, setMessages] = useState<PlayerPrivateMessage[]>([]);
  const [friendInput, setFriendInput] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  return (
    <section className="panel player-social-page">
      <div className="player-social-header">
        <div>
          <h2>好友与私聊</h2>
          <p className="panel-copy">添加好友后可在右侧窗口进行基础私聊。</p>
        </div>
        <div className="player-social-add">
          <input
            type="text"
            value={friendInput}
            onChange={(event) => setFriendInput(event.target.value)}
            placeholder="输入用户 ID，如 designer-1"
          />
          <button type="button" onClick={() => void handleAddFriend()}>
            添加好友
          </button>
        </div>
      </div>

      {error ? <p className="feedback error">{error}</p> : null}
      {notice ? <p className="feedback success">{notice}</p> : null}

      <div className="player-social-layout">
        <aside className="player-social-friends">
          <h3>好友列表</h3>
          {loading ? <p className="panel-copy">加载中…</p> : null}
          {!loading && friends.length === 0 ? (
            <p className="panel-copy">还没有好友，先添加一个吧。</p>
          ) : null}
          <ul className="player-social-friend-list">
            {friends.map((friend) => (
              <li key={friend.userId}>
                <button
                  type="button"
                  className={selectedFriendId === friend.userId ? "is-active" : undefined}
                  onClick={() => setSelectedFriendId(friend.userId)}
                >
                  <strong>{friend.displayName}</strong>
                  <span>{friend.userId}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="player-social-chat">
          {selectedFriend ? (
            <>
              <div className="player-social-chat-header">
                <strong>{selectedFriend.displayName}</strong>
                <span>{selectedFriend.userId}</span>
              </div>
              <div className="player-social-messages">
                {messageLoading ? <p className="panel-copy">加载消息…</p> : null}
                {!messageLoading && messages.length === 0 ? (
                  <p className="panel-copy">还没有消息，发送第一条吧。</p>
                ) : null}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={message.mine ? "player-social-message-row is-mine" : "player-social-message-row"}
                  >
                    <article className={message.mine ? "player-social-message is-mine" : "player-social-message"}>
                      <p>{message.content}</p>
                    </article>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="player-social-compose">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(event) => setMessageInput(event.target.value)}
                  placeholder="输入消息…"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleSendMessage();
                    }
                  }}
                />
                <button type="button" onClick={() => void handleSendMessage()}>
                  发送
                </button>
              </div>
            </>
          ) : (
            <p className="panel-copy">从左侧选择一位好友开始聊天。</p>
          )}
        </div>
      </div>
    </section>
  );
};
