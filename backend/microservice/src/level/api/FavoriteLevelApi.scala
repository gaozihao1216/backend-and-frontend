package microservice.level.api

import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.core.{APIWithTokenMessage, AccessControl, HttpError}
import microservice.level.objects.Favorite
import microservice.level.tables.FavoriteTable
import microservice.level.utils.LevelApiSupport
import microservice.system.objects.UserRole

final case class FavoriteLevelAPIMessage(
  playerId: String,
  levelId: String
) extends APIWithTokenMessage[Favorite] {
  override def token: String = playerId

  override def plan(connection: Connection): IO[Either[HttpError, Favorite]] =
    IO.pure(
      AccessControl.requireRole(connection, playerId, UserRole.Player).flatMap(_ => LevelApiSupport.publishedLevel(connection, levelId).map { _ =>
        FavoriteTable.find(connection, playerId, levelId).getOrElse {
          FavoriteTable.insert(
            connection,
            Favorite(
              id = FavoriteTable.nextId(connection),
              levelId = levelId,
              userId = playerId,
              createdAt = Instant.now().toString
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
