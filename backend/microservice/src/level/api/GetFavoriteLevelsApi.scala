package microservice.level.api

import cats.effect.IO
import java.sql.Connection
import microservice.core.{APIWithTokenMessage, AccessControl, HttpError, RowMappers}
import microservice.level.objects.FavoriteWithLevel
import microservice.level.tables.FavoriteTable
import microservice.system.objects.UserRole

final case class GetFavoriteLevelsRequest(
  playerId: String
)

final case class GetFavoriteLevelsAPIMessage(
  playerId: String
) extends APIWithTokenMessage[List[FavoriteWithLevel]] {
  override def token: String = playerId

  override def plan(connection: Connection): IO[Either[HttpError, List[FavoriteWithLevel]]] =
    IO.pure(
      AccessControl.requireRole(connection, playerId, UserRole.Player).map(_ =>
        FavoriteTable.listPublishedByUser(connection, playerId)
          .map { case (favorite, level) => FavoriteWithLevel.from(favorite, RowMappers.toLevel(level)) }
          .toList
      )
    )
}

object GetFavoriteLevelsEndpoint {
  val name: String = "GetFavoriteLevels"
  val method: String = "GET"
  val path: String = "/player/favorites"
  val businessLogic: String =
    "返回玩家收藏且仍处于 published 的关卡列表。"
}
