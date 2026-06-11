package microservice.level.api

import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.api.{APIWithTokenMessage}
import microservice.infrastructure.http.{HttpError}
import microservice.user.utils.AccessControl
import microservice.level.objects.Favorite
import microservice.level.tables.favorite.FavoriteTable
import microservice.level.utils.LevelApiSupport
import microservice.system.objects.UserRole

/** POST /player/levels/:levelId/favorite 的 APIMessage：收藏关卡。 */
final case class FavoriteLevelAPIMessage(
  playerId: String,
  levelId: String
) extends APIWithTokenMessage[Favorite] {
  override def token: String = playerId

  /** 收藏已发布关卡；已收藏则幂等返回现有记录。
    *
    * 实现：requireRole(Player) → 校验关卡已发布 → find 或 insert。
    * 关联：GetFavoriteLevelsAPIMessage 列出收藏；UnfavoriteLevelAPIMessage 取消。
    */
  override def plan(connection: Connection): IO[Either[HttpError, Favorite]] =
    IO.pure(
      AccessControl.requireRole(connection, playerId, UserRole.Player).flatMap(_ => LevelApiSupport.publishedLevel(connection, levelId).map { _ =>
        // 幂等：已有收藏记录则直接返回，否则新建
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
