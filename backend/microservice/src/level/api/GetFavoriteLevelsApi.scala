package microservice.level.api

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage}
import microservice.infrastructure.http.{HttpError}
import microservice.user.utils.AccessControl
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.objects.FavoriteWithLevel
import microservice.level.tables.favorite.FavoriteTable
import microservice.system.objects.UserRole

/** GET /player/favorites 的 APIMessage：返回当前玩家的收藏列表（含关卡详情）。 */
final case class GetFavoriteLevelsAPIMessage(
  playerId: String
) extends APIWithTokenMessage[List[FavoriteWithLevel]] {
  override def token: String = playerId

  /** 列出当前玩家收藏的全部已发布关卡。
    *
    * 实现：requireRole(Player) → FavoriteTable.listPublishedByUser → 组装 FavoriteWithLevel。
    * 关联：FavoriteWithLevel.from 将 Favorite 与 Level 合并为前端所需结构。
    */
  override def plan(connection: Connection): IO[Either[HttpError, List[FavoriteWithLevel]]] =
    IO.pure(
      AccessControl.requireRole(connection, playerId, UserRole.Player).map(_ =>
        FavoriteTable.listPublishedByUser(connection, playerId)
          .map { case (favorite, level) => FavoriteWithLevel.from(favorite, LevelRowMapper.toLevel(level)) }
          .toList
      )
    )
}
