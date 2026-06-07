package microservice.player.social

final case class PlayerFriendSummary(
  userId: String,
  displayName: String,
  since: String
)

final case class PlayerPrivateMessageView(
  id: String,
  senderId: String,
  receiverId: String,
  content: String,
  createdAt: String,
  mine: Boolean
)

final case class PlayerFriendListResponse(friends: List[PlayerFriendSummary])

final case class PlayerMessageListResponse(messages: List[PlayerPrivateMessageView])

final case class AddFriendRequest(friendUserId: String)

final case class SendPrivateMessageRequest(receiverId: String, content: String)
