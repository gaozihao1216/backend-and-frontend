package microservice.player.objects

import io.circe.Json

/** 社交 API 响应 JSON 编码（无 Connection 依赖）。 */
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
