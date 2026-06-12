package microservice.player.tables.social

final case class PlayerFriendRow(userId: String, friendUserId: String, createdAt: String)

final case class PlayerPrivateMessageRow(
  id: String,
  senderId: String,
  receiverId: String,
  content: String,
  createdAt: String
)
