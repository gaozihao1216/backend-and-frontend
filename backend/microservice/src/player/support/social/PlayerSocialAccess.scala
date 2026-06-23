package microservice.player.support.social

import java.sql.Connection
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.player.tables.social.PlayerFriendTable
import microservice.user.tables.user.UserTable

/** 玩家社交（好友、私信）的前置校验。 */
object PlayerSocialAccess {
  def requireValidFriendRequest(userId: String, friendUserId: String): Step[Unit] =
    PlanStep.fromEither(checkValidFriendRequest(userId, friendUserId))

  def requireExistingUser(connection: Connection, userId: String): Step[Unit] =
    PlanStep.fromEither(checkExistingUser(connection, userId))

  def requireFriendship(connection: Connection, userId: String, otherUserId: String): Step[Unit] =
    PlanStep.fromEither(checkFriendship(connection, userId, otherUserId))

  def requireValidMessage(receiverId: String, content: String): Step[String] =
    PlanStep.fromEither(checkValidMessage(receiverId, content))

  def requireValidChatTarget(withUserId: String): Step[Unit] =
    PlanStep.fromEither(checkValidChatTarget(withUserId))

  def checkValidFriendRequest(userId: String, friendUserId: String): Either[HttpError, Unit] =
    if (friendUserId.trim.isEmpty) {
      Left(HttpError.badRequest("INVALID_FRIEND", "friendUserId is required"))
    } else if (userId == friendUserId) {
      Left(HttpError.badRequest("INVALID_FRIEND", "Cannot add yourself as a friend"))
    } else {
      Right(())
    }

  def checkExistingUser(connection: Connection, userId: String): Either[HttpError, Unit] =
    UserTable.findById(connection, userId) match {
      case None    => Left(HttpError.notFound("FRIEND_NOT_FOUND", s"User not found: $userId"))
      case Some(_) => Right(())
    }

  def checkFriendship(connection: Connection, userId: String, otherUserId: String): Either[HttpError, Unit] =
    if (!PlayerFriendTable.exists(connection, userId, otherUserId)) {
      Left(HttpError.forbidden("You can only chat with friends"))
    } else {
      Right(())
    }

  def checkValidMessage(receiverId: String, content: String): Either[HttpError, String] = {
    val trimmed = content.trim
    if (receiverId.trim.isEmpty || trimmed.isEmpty) {
      Left(HttpError.badRequest("INVALID_MESSAGE", "receiverId and content are required"))
    } else {
      Right(trimmed)
    }
  }

  def checkValidChatTarget(withUserId: String): Either[HttpError, Unit] =
    if (withUserId.trim.isEmpty) {
      Left(HttpError.badRequest("INVALID_CHAT_TARGET", "withUserId is required"))
    } else {
      Right(())
    }
}
