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

/** POST /player/social/friends — 添加好友并返回最新列表。 */
final case class AddFriendAPIMessage(userId: String, friendUserId: String) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireRole(connection, userId, UserRole.Player))
        _ <- PlanSteps.require(
          if (friendUserId.trim.isEmpty) {
            Left(HttpError.badRequest("INVALID_FRIEND", "friendUserId is required"))
          } else if (userId == friendUserId) {
            Left(HttpError.badRequest("INVALID_FRIEND", "Cannot add yourself as a friend"))
          } else {
            Right(())
          }
        )
        _ <- PlanSteps.require(
          UserTable.findById(connection, friendUserId) match {
            case None    => Left(HttpError.notFound("FRIEND_NOT_FOUND", s"User not found: $friendUserId"))
            case Some(_) => Right(())
          }
        )
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
