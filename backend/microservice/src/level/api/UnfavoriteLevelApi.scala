package microservice.level.api

import cats.effect.IO
import java.sql.Connection
import microservice.core.{APIWithTokenMessage, AccessControl, HttpError}
import microservice.level.objects.Favorite
import microservice.level.tables.FavoriteTable
import microservice.level.utils.LevelApiSupport
import microservice.system.objects.UserRole

final case class UnfavoriteLevelAPIMessage(
  playerId: String,
  levelId: String
) extends APIWithTokenMessage[Favorite] {
  override def token: String = playerId

  override def plan(connection: Connection): IO[Either[HttpError, Favorite]] =
    IO.pure(
      AccessControl.requireRole(connection, playerId, UserRole.Player).flatMap(_ => LevelApiSupport.publishedLevel(connection, levelId).flatMap { _ =>
        FavoriteTable.delete(connection, playerId, levelId).toRight(HttpError.notFound("FAVORITE_NOT_FOUND", "Favorite not found"))
      })
    )
}

object UnfavoriteLevelEndpoint {
  val name: String = "UnfavoriteLevel"
  val method: String = "DELETE"
  val path: String = "/player/levels/:levelId/favorite"
  val businessLogic: String =
    "玩家取消收藏已发布关卡。"
}
