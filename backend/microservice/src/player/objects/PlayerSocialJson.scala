package microservice.player.objects

import io.circe.Json

/** 社交响应 Circe 编码辅助。
  *
  * 定义：toJsonFriends/toJsonMessages 转 Json。
  * 问题：APIMessage 返回 Json 类型，集中序列化避免重复。
  * 作用：objects → Json.obj 字段名与前端约定一致。
  * 关联：social 包下 APIMessage yield 分支。
  */
object PlayerSocialJson {
  def toJsonFriends(response: PlayerFriendListResponse): Json =
    Json.obj(
      "friends" -> Json.arr(response.friends.map { friend =>
        Json.obj(
          "userId" -> Json.fromString(friend.userId),
          "displayName" -> Json.fromString(friend.displayName),
          "since" -> Json.fromString(friend.since)
        )
      }: _*)
    )

  def toJsonMessages(response: PlayerMessageListResponse): Json =
    Json.obj(
      "messages" -> Json.arr(response.messages.map { message =>
        Json.obj(
          "id" -> Json.fromString(message.id),
          "senderId" -> Json.fromString(message.senderId),
          "receiverId" -> Json.fromString(message.receiverId),
          "content" -> Json.fromString(message.content),
          "createdAt" -> Json.fromString(message.createdAt),
          "mine" -> Json.fromBoolean(message.mine)
        )
      }: _*)
    )
}
