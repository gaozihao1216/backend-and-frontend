package microservice.player.api.social

import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.objects.{PlayerFriendListResponse, PlayerFriendSummary, PlayerSocialJson}
import microservice.player.tables.social.PlayerFriendTable
import microservice.system.objects.UserRole
import microservice.user.tables.user.UserTable
import microservice.user.utils.AccessControl

/** GET /player/social/friends 好友列表 APIMessage。
  *
  * 定义：单 userId 入参，返回 PlayerFriendListResponse JSON。
  * 问题：社交页需展示好友昵称而非仅 id。
  * 作用：listFriendUserIds → UserTable 批量查 displayName → PlayerSocialJson。
  * 关联：[[PlayerSocialRouter]] GET；[[PlayerFriendTable]]。
  */
final case class ListFriendsAPIMessage(userId: String) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireRole(connection, userId, UserRole.Player)
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
