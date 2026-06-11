package microservice.player.api.social

import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import microservice.infrastructure.api.APIWithTokenMessage
import microservice.infrastructure.http.HttpError
import microservice.player.social.PlayerSocialService

/** GET /player/social/messages?withUserId= — 与指定好友的私信记录。 */
final case class ListMessagesAPIMessage(userId: String, withUserId: String) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    IO.pure(PlayerSocialService.listMessages(connection, userId, withUserId).map(PlayerSocialService.toJsonMessages))
}
