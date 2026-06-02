package microservice.level.api

import cats.effect.IO
import java.sql.Connection
import microservice.core.{APIWithTokenMessage, AccessControl, HttpError}
import microservice.level.objects.Favorite
import microservice.level.tables.FavoriteTable
import microservice.level.utils.LevelApiSupport
import microservice.system.objects.UserRole

final case class UnfavoriteLevelRequest(
  playerId: String,
  levelId: String
)

final case class UnfavoriteLevelAPIMessage(
  token: String,
  levelId: String
) extends APIWithTokenMessage[Favorite] {
  override def plan(connection: Connection): IO[Either[HttpError, Favorite]] =
    IO.pure(
      AccessControl.requireRole(token, UserRole.Player).flatMap(_ => LevelApiSupport.publishedLevel(levelId).flatMap { _ =>
        FavoriteTable.delete(token, levelId).toRight(HttpError.notFound("FAVORITE_NOT_FOUND", "Favorite not found"))
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
