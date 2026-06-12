package microservice.player.api.social

import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.social.{PlayerMessageListResponse, PlayerPrivateMessageView, PlayerSocialJson}
import microservice.player.tables.social.{PlayerFriendTable, PlayerPrivateMessageRow, PlayerPrivateMessageTable}
import microservice.system.objects.UserRole
import microservice.user.utils.AccessControl

/** POST /player/social/messages — 向好友发送私信。 */
final case class SendMessageAPIMessage(userId: String, receiverId: String, content: String)
    extends APIWithTokenMessage[Json] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    PlanSteps.finish {
      val trimmed = content.trim
      for {
        _ <- PlanSteps.require(AccessControl.requireRole(connection, userId, UserRole.Player))
        _ <- PlanSteps.require(
          if (receiverId.trim.isEmpty || trimmed.isEmpty) {
            Left(HttpError.badRequest("INVALID_MESSAGE", "receiverId and content are required"))
          } else {
            Right(())
          }
        )
        _ <- PlanSteps.require(
          if (!PlayerFriendTable.exists(connection, userId, receiverId)) {
            Left(HttpError.forbidden("You can only chat with friends"))
          } else {
            Right(())
          }
        )
        _ <- PlanSteps.read(
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
        )
        messages <- PlanSteps.read(
          PlayerPrivateMessageTable
            .listConversation(connection, userId, receiverId)
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
