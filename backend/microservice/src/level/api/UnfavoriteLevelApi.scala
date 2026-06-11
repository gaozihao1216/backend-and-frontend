package microservice.level.api

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage}
import microservice.infrastructure.http.{HttpError}
import microservice.user.utils.AccessControl
import microservice.level.objects.Favorite
import microservice.level.tables.favorite.FavoriteTable
import microservice.level.utils.LevelApiSupport
import microservice.system.objects.UserRole

/** DELETE /player/levels/:levelId/favorite 的 APIMessage：取消收藏。 */
final case class UnfavoriteLevelAPIMessage(
  playerId: String,
  levelId: String
) extends APIWithTokenMessage[Favorite] {
  override def token: String = playerId

  /** 取消对已发布关卡的收藏。
    *
    * 实现：requireRole(Player) → 校验关卡已发布 → FavoriteTable.delete。
    * 关联：收藏不存在时返回 FAVORITE_NOT_FOUND。
    */
  override def plan(connection: Connection): IO[Either[HttpError, Favorite]] =
    IO.pure(
      AccessControl.requireRole(connection, playerId, UserRole.Player).flatMap(_ => LevelApiSupport.publishedLevel(connection, levelId).flatMap { _ =>
        FavoriteTable.delete(connection, playerId, levelId).toRight(HttpError.notFound("FAVORITE_NOT_FOUND", "Favorite not found"))
      })
    )
}
