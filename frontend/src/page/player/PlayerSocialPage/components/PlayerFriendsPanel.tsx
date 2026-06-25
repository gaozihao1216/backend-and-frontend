import type { PlayerFriend } from "../../../../api/player/social/PlayerSocialSchemas.js";

type PlayerSocialHeaderProps = {
  friendInput: string;
  onFriendInputChange: (value: string) => void;
  onAddFriend: () => void;
};

export const PlayerSocialHeader = ({
  friendInput,
  onFriendInputChange,
  onAddFriend,
}: PlayerSocialHeaderProps) => (
  <div className="player-social-header">
    <div>
      <h2>好友与私聊</h2>
      <p className="panel-copy">添加好友后可在右侧窗口进行基础私聊。</p>
    </div>
    <div className="player-social-add">
      <input
        type="text"
        value={friendInput}
        onChange={(event) => onFriendInputChange(event.target.value)}
        placeholder="输入用户 ID，如 designer-1"
      />
      <button type="button" onClick={() => void onAddFriend()}>
        添加好友
      </button>
    </div>
  </div>
);

type PlayerFriendsListProps = {
  friends: PlayerFriend[];
  loading: boolean;
  selectedFriendId: string | null;
  onSelectFriend: (friendUserId: string) => void;
};

export const PlayerFriendsList = ({
  friends,
  loading,
  selectedFriendId,
  onSelectFriend,
}: PlayerFriendsListProps) => (
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
            onClick={() => onSelectFriend(friend.userId)}
          >
            <strong>{friend.displayName}</strong>
            <span>{friend.userId}</span>
          </button>
        </li>
      ))}
    </ul>
  </aside>
);
