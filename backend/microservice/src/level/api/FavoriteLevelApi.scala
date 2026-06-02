package microservice.level.api

import cats.effect.IO
import java.sql.Connection
import microservice.core.{APIWithTokenMessage, AccessControl, HttpError}
import microservice.level.objects.Favorite
import microservice.level.tables.FavoriteTable
import microservice.level.utils.LevelApiSupport
import microservice.system.objects.UserRole

final case class FavoriteLevelRequest(
  playerId: String,
  levelId: String
)

final case class FavoriteLevelAPIMessage(
  token: String,
  levelId: String
) extends APIWithTokenMessage[Favorite] {
  override def plan(connection: Connection): IO[Either[HttpError, Favorite]] =
    IO.pure(
      AccessControl.requireRole(token, UserRole.Player).flatMap(_ => LevelApiSupport.publishedLevel(levelId).map { _ =>
        FavoriteTable.find(token, levelId).getOrElse {
          FavoriteTable.insert(
            Favorite(
              id = s"favorite-${FavoriteTable.count + 1}",
              levelId = levelId,
              userId = token,
              createdAt = "2026-05-26T13:40:00Z"
            )
          )
        }
      })
    )
}

object FavoriteLevelEndpoint {
  val name: String = "FavoriteLevel"
  val method: String = "POST"
  val path: String = "/player/levels/:levelId/favorite"
  val businessLogic: String =
    "玩家收藏已发布关卡，重复收藏返回已有记录。"
}
