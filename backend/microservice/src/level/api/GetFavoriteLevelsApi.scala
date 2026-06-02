package microservice.level.api

import cats.effect.IO
import java.sql.Connection
import microservice.core.{APIWithTokenMessage, AccessControl, HttpError, RowMappers}
import microservice.level.objects.FavoriteWithLevel
import microservice.level.tables.{FavoriteTable, LevelTable}
import microservice.system.objects.LevelStatus
import microservice.system.objects.UserRole

final case class GetFavoriteLevelsRequest(
  playerId: String
)

final case class GetFavoriteLevelsAPIMessage(
  token: String
) extends APIWithTokenMessage[List[FavoriteWithLevel]] {
  override def plan(connection: Connection): IO[Either[HttpError, List[FavoriteWithLevel]]] =
    IO.pure(
      AccessControl.requireRole(token, UserRole.Player).map(_ =>
        FavoriteTable.all
          .filter(_.userId == token)
          .sortBy(_.createdAt)(Ordering[String].reverse)
          .flatMap(favorite =>
            LevelTable.findById(favorite.levelId)
              .filter(_.status == LevelStatus.Published)
              .map(level => FavoriteWithLevel.from(favorite, RowMappers.toLevel(level)))
          )
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
