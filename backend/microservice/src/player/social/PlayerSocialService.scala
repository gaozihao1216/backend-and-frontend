package microservice.player.social

import microservice.user.tables.user.UserTable
import microservice.infrastructure.http.HttpError
import microservice.player.tables.social.{PlayerFriendTable, PlayerPrivateMessageRow, PlayerPrivateMessageTable}
import io.circe.Json
import io.circe.syntax._
import java.sql.Connection
import java.time.Instant

object PlayerSocialService {
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
