import { useEffect, useRef } from "react";
import type { PlayerFriend, PlayerPrivateMessage } from "../../../../api/player-social-api.js";

type PlayerChatPanelProps = {
  selectedFriend: PlayerFriend | null;
  messages: PlayerPrivateMessage[];
  messageLoading: boolean;
  messageInput: string;
  onMessageInputChange: (value: string) => void;
  onSendMessage: () => void;
};

export const PlayerChatPanel = ({
  selectedFriend,
  messages,
  messageLoading,
  messageInput,
  onMessageInputChange,
  onSendMessage,
}: PlayerChatPanelProps) => {
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!selectedFriend) {
    return (
      <div className="player-social-chat">
        <p className="panel-copy">从左侧选择一位好友开始聊天。</p>
      </div>
    );
  }

  return (
    <div className="player-social-chat">
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
          onChange={(event) => onMessageInputChange(event.target.value)}
          placeholder="输入消息…"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void onSendMessage();
            }
          }}
        />
        <button type="button" onClick={() => void onSendMessage()}>
          发送
        </button>
      </div>
    </div>
  );
};
