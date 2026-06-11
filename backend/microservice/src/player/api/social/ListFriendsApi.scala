package microservice.player.api.social

import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import microservice.infrastructure.api.APIWithTokenMessage
import microservice.infrastructure.http.HttpError
import microservice.player.social.PlayerSocialService

/** GET /player/social/friends — 列出当前用户的好友摘要。 */
final case class ListFriendsAPIMessage(userId: String) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    IO.pure(PlayerSocialService.listFriends(connection, userId).map(PlayerSocialService.toJsonFriends))
}
