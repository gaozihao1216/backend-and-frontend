package microservice.player.objects.social

/** 玩家社交 API 领域对象。
  *
  * 定义：好友摘要、私信视图、请求体 case class。
  * 问题：social JSON 形状与前端 Zod schema 一致。
  * 作用：AddFriendRequest、PlayerPrivateMessageView 等。
  * 关联：[[PlayerSocialJson]]；social 包下 APIMessage。
  */
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
