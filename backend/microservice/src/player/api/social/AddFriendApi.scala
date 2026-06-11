package microservice.player.api.social

import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import microservice.infrastructure.api.APIWithTokenMessage
import microservice.infrastructure.http.HttpError
import microservice.player.social.PlayerSocialService

/** POST /player/social/friends — 添加好友并返回最新列表。 */
final case class AddFriendAPIMessage(userId: String, friendUserId: String) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    IO.pure(PlayerSocialService.addFriend(connection, userId, friendUserId).map(PlayerSocialService.toJsonFriends))
}
