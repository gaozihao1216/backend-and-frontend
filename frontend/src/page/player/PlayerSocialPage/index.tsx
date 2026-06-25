import { usePlayerSocial } from "./hooks/usePlayerSocial.js";
import { PageFeedback } from "../shared/PageFeedback.js";
import { PlayerChatPanel } from "./components/PlayerChatPanel.js";
import { PlayerFriendsList, PlayerSocialHeader } from "./components/PlayerFriendsPanel.js";
import type { PlayerSocialPageProps } from "./objects/player-social-page-types.js";

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
