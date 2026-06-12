package microservice.player.objects

/** 好友列表中的单个好友摘要（含展示名与加好友时间占位）。 */
final case class PlayerFriendSummary(
  userId: String,
  displayName: String,
  since: String
)

/** 私信视图：含 mine 标记以区分收发方向。 */
final case class PlayerPrivateMessageView(
  id: String,
  senderId: String,
  receiverId: String,
  content: String,
  createdAt: String,
  mine: Boolean
)

/** GET/POST /social/friends 的响应体。 */
final case class PlayerFriendListResponse(friends: List[PlayerFriendSummary])

/** GET/POST /social/messages 的响应体。 */
final case class PlayerMessageListResponse(messages: List[PlayerPrivateMessageView])

/** POST /social/friends 请求体：待添加的好友 userId。 */
final case class AddFriendRequest(friendUserId: String)

/** POST /social/messages 请求体：接收者与消息内容。 */
final case class SendPrivateMessageRequest(receiverId: String, content: String)
