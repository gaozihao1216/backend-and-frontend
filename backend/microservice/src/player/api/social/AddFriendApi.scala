package microservice.player.api.social

import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.objects.{PlayerFriendListResponse, PlayerFriendSummary, PlayerSocialJson}
import microservice.player.support.social.PlayerSocialAccess
import microservice.player.tables.social.PlayerFriendTable
import microservice.system.objects.UserRole
import microservice.user.api.internal.player.ListUserDisplaySummariesInternalAPIMessage
import microservice.user.support.AccessControl

/** POST /player/social/friends 添加好友 APIMessage。 */
final case class AddFriendAPIMessage(userId: String, friendUserId: String) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireRole(connection, userId, UserRole.Player)
        _ <- PlayerSocialAccess.requireValidFriendRequest(userId, friendUserId)
        _ <- PlayerSocialAccess.requireExistingUser(connection, friendUserId)
        _ <- PlanSteps.read(PlayerFriendTable.insertPair(connection, userId, friendUserId))
        friendIds <- PlanSteps.read(PlayerFriendTable.listFriendUserIds(connection, userId))
        summaries <- PlanSteps.runApi(ListUserDisplaySummariesInternalAPIMessage(friendIds.toList), connection)
        friends = summaries.map(summary => PlayerFriendSummary(summary.userId, summary.displayName, "linked"))
      } yield PlayerSocialJson.toJsonFriends(PlayerFriendListResponse(friends))
    }
}
