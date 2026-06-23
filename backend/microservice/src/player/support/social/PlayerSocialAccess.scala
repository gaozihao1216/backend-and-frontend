package microservice.player.support.social

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.api.PlanSteps
import microservice.infrastructure.http.HttpError
import microservice.player.tables.social.PlayerFriendTable
import microservice.user.api.internal.player.UserExistsInternalAPIMessage

/** 玩家社交（好友、私信）的前置校验。 */
object PlayerSocialAccess {
  def requireValidFriendRequest(userId: String, friendUserId: String): Step[Unit] =
    if (friendUserId.trim.isEmpty) {
      PlanStep.fail(HttpError.badRequest("INVALID_FRIEND", "friendUserId is required"))
    } else if (userId == friendUserId) {
      PlanStep.fail(HttpError.badRequest("INVALID_FRIEND", "Cannot add yourself as a friend"))
    } else {
      PlanStep.succeed(())
    }

  def requireExistingUser(connection: Connection, userId: String): Step[Unit] =
    PlanSteps.runApi(UserExistsInternalAPIMessage(userId), connection).map(_ => ())

  def requireFriendship(connection: Connection, userId: String, otherUserId: String): Step[Unit] =
    EitherT.liftF(IO(PlayerFriendTable.exists(connection, userId, otherUserId))).flatMap {
      case false => EitherT.leftT(HttpError.forbidden("You can only chat with friends"))
      case true  => EitherT.rightT(())
    }

  def requireValidMessage(receiverId: String, content: String): Step[String] = {
    val trimmed = content.trim
    if (receiverId.trim.isEmpty || trimmed.isEmpty) {
      PlanStep.fail(HttpError.badRequest("INVALID_MESSAGE", "receiverId and content are required"))
    } else {
      PlanStep.succeed(trimmed)
    }
  }

  def requireValidChatTarget(withUserId: String): Step[Unit] =
    if (withUserId.trim.isEmpty) {
      PlanStep.fail(HttpError.badRequest("INVALID_CHAT_TARGET", "withUserId is required"))
    } else {
      PlanStep.succeed(())
    }
}
