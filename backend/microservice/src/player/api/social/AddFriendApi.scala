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
import microservice.user.tables.user.UserTable
import microservice.user.utils.AccessControl

/** POST /player/social/friends 添加好友 APIMessage。
  *
  * 定义：userId + friendUserId 双参，返回好友列表 JSON。
  * 问题：添加后需立即返回更新列表，且不能加自己或不存在用户。
  * 作用：校验 Player 角色 → 业务规则 → insertPair → 重查好友并映射 displayName。
  * 关联：[[PlayerSocialRouter]] POST；[[PlayerFriendTable.insertPair]]。
  */
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
        friends <- PlanSteps.read(
          friendIds.flatMap { id =>
            UserTable.findById(connection, id).map { user =>
              PlayerFriendSummary(user.id, user.displayName, "linked")
            }
          }.toList
        )
      } yield PlayerSocialJson.toJsonFriends(PlayerFriendListResponse(friends))
    }
}
