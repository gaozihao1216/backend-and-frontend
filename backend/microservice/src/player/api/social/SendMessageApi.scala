package microservice.player.api.social

import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import microservice.infrastructure.api.APIWithTokenMessage
import microservice.infrastructure.http.HttpError
import microservice.player.social.PlayerSocialService

/** POST /player/social/messages — 向好友发送私信。 */
final case class SendMessageAPIMessage(userId: String, receiverId: String, content: String)
    extends APIWithTokenMessage[Json] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    IO.pure(
      PlayerSocialService.sendMessage(connection, userId, receiverId, content).map(PlayerSocialService.toJsonMessages)
    )
}
