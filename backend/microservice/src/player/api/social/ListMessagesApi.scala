package microservice.player.api.social

import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.objects.{PlayerMessageListResponse, PlayerPrivateMessageView, PlayerSocialJson}
import microservice.player.tables.social.{PlayerFriendTable, PlayerPrivateMessageTable}
import microservice.system.objects.UserRole
import microservice.user.utils.AccessControl

/** GET /player/social/messages — 列出与指定好友的私信记录。 */
final case class ListMessagesAPIMessage(userId: String, withUserId: String) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireRole(connection, userId, UserRole.Player))
        _ <- PlanSteps.require(
          if (withUserId.trim.isEmpty) {
            Left(HttpError.badRequest("INVALID_CHAT_TARGET", "withUserId is required"))
          } else {
            Right(())
          }
        )
        _ <- PlanSteps.require(
          if (!PlayerFriendTable.exists(connection, userId, withUserId)) {
            Left(HttpError.forbidden("You can only chat with friends"))
          } else {
            Right(())
          }
        )
        messages <- PlanSteps.read(
          PlayerPrivateMessageTable
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
        )
      } yield PlayerSocialJson.toJsonMessages(PlayerMessageListResponse(messages))
    }
}
