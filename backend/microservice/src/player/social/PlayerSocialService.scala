package microservice.player.social

import microservice.user.tables.user.UserTable
import microservice.infrastructure.http.HttpError
import microservice.player.tables.social.{PlayerFriendTable, PlayerPrivateMessageRow, PlayerPrivateMessageTable}
import io.circe.Json
import io.circe.syntax._
import java.sql.Connection
import java.time.Instant

/** 玩家社交业务服务：好友管理与好友间私信。
  *
  * 实现：好友关系双向写入；私信仅允许已互为好友的用户。
  * 关联：PlayerSocialRouter；数据表 PlayerFriendTable / PlayerPrivateMessageTable。
  */
object PlayerSocialService {
  /** 列出当前用户的全部好友（join UserTable 获取 displayName）。 */
  def listFriends(connection: Connection, userId: String): Either[HttpError, PlayerFriendListResponse] = {
    val friendIds = PlayerFriendTable.listFriendUserIds(connection, userId)
    val friends = friendIds.flatMap { friendId =>
      UserTable.findById(connection, friendId).map { user =>
        PlayerFriendSummary(
          userId = user.id,
          displayName = user.displayName,
          since = "linked"
        )
      }
    }.toList
    Right(PlayerFriendListResponse(friends))
  }

  /** 添加好友：校验目标用户存在且非自己，双向插入后返回最新好友列表。 */
  def addFriend(connection: Connection, userId: String, friendUserId: String): Either[HttpError, PlayerFriendListResponse] = {
    if (friendUserId.trim.isEmpty) {
      return Left(HttpError.badRequest("INVALID_FRIEND", "friendUserId is required"))
    }
    if (userId == friendUserId) {
      return Left(HttpError.badRequest("INVALID_FRIEND", "Cannot add yourself as a friend"))
    }
    UserTable.findById(connection, friendUserId) match {
      case None => Left(HttpError.notFound("FRIEND_NOT_FOUND", s"User not found: $friendUserId"))
      case Some(_) =>
        PlayerFriendTable.insertPair(connection, userId, friendUserId)
        listFriends(connection, userId)
    }
  }

  /** 列出与指定好友的私信记录（按时间升序）；非好友返回 403。 */
  def listMessages(connection: Connection, userId: String, withUserId: String): Either[HttpError, PlayerMessageListResponse] = {
    if (withUserId.trim.isEmpty) {
      return Left(HttpError.badRequest("INVALID_CHAT_TARGET", "withUserId is required"))
    }
    if (!PlayerFriendTable.exists(connection, userId, withUserId)) {
      return Left(HttpError.forbidden("You can only chat with friends"))
    }
    val messages = PlayerPrivateMessageTable
      .listConversation(connection, userId, withUserId)
      .map { row =>
        PlayerPrivateMessageView(
          id = row.id,
          senderId = row.senderId,
          receiverId = row.receiverId,
          content = row.content,
          createdAt = row.createdAt,
          mine = row.senderId == userId
        )
      }
      .toList
    Right(PlayerMessageListResponse(messages))
  }

  /** 向好友发送私信并返回更新后的会话列表。 */
  def sendMessage(
    connection: Connection,
    userId: String,
    receiverId: String,
    content: String
  ): Either[HttpError, PlayerMessageListResponse] = {
    val trimmed = content.trim
    if (receiverId.trim.isEmpty || trimmed.isEmpty) {
      return Left(HttpError.badRequest("INVALID_MESSAGE", "receiverId and content are required"))
    }
    if (!PlayerFriendTable.exists(connection, userId, receiverId)) {
      return Left(HttpError.forbidden("You can only chat with friends"))
    }
    PlayerPrivateMessageTable.insert(
      connection,
      PlayerPrivateMessageRow(
        id = PlayerPrivateMessageTable.nextId(connection),
        senderId = userId,
        receiverId = receiverId,
        content = trimmed,
        createdAt = Instant.now().toString
      )
    )
    listMessages(connection, userId, receiverId)
  }

  /** 将好友列表响应序列化为 API JSON（Router 层 ApiSuccess 包装前使用）。 */
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

  /** 将私信列表响应序列化为 API JSON。 */
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
