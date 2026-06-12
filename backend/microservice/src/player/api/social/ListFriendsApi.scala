package microservice.player.api.social

import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.social.{PlayerFriendListResponse, PlayerFriendSummary, PlayerSocialJson}
import microservice.player.tables.social.PlayerFriendTable
import microservice.system.objects.UserRole
import microservice.user.tables.user.UserTable
import microservice.user.utils.AccessControl

/** GET /player/social/friends — 列出当前用户的好友摘要。 */
final case class ListFriendsAPIMessage(userId: String) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireRole(connection, userId, UserRole.Player))
        friendIds <- PlanSteps.read(PlayerFriendTable.listFriendUserIds(connection, userId))
        friends <- PlanSteps.read(
          friendIds.flatMap { friendId =>
            UserTable.findById(connection, friendId).map { user =>
              PlayerFriendSummary(user.id, user.displayName, "linked")
            }
          }.toList
        )
      } yield PlayerSocialJson.toJsonFriends(PlayerFriendListResponse(friends))
    }
}
