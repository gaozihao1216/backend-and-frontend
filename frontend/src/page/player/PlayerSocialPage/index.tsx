import { usePlayerSocial } from "../../../hook/player-page/usePlayerSocial.js";
import { PageFeedback } from "../../../component/player-page/PageFeedback.js";
import { PlayerChatPanel } from "../../../component/player-page/PlayerChatPanel.js";
import { PlayerFriendsList, PlayerSocialHeader } from "../../../component/player-page/PlayerFriendsPanel.js";

type PlayerSocialPageProps = {
  userId: string;
};

export const PlayerSocialPage = ({ userId }: PlayerSocialPageProps) => {
  const social = usePlayerSocial(userId);

  return (
    <section className="panel player-social-page">
      <PlayerSocialHeader
        friendInput={social.friendInput}
        onFriendInputChange={social.setFriendInput}
        onAddFriend={social.handleAddFriend}
      />

      <PageFeedback error={social.error} notice={social.notice} />

      <div className="player-social-layout">
        <PlayerFriendsList
          friends={social.friends}
          loading={social.loading}
          selectedFriendId={social.selectedFriendId}
          onSelectFriend={social.setSelectedFriendId}
        />

        <PlayerChatPanel
          selectedFriend={social.selectedFriend}
          messages={social.messages}
          messageLoading={social.messageLoading}
          messageInput={social.messageInput}
          onMessageInputChange={social.setMessageInput}
          onSendMessage={social.handleSendMessage}
        />
      </div>
    </section>
  );
};
