package microservice.level.api

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage}
import microservice.infrastructure.http.{HttpError}
import microservice.user.utils.AccessControl
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.objects.Level
import microservice.level.utils.LevelApiSupport
import microservice.system.objects.UserRole

/** GET /player/levels/:levelId 的 APIMessage：返回单个已发布关卡详情。 */
final case class GetPublishedLevelAPIMessage(
  playerId: String,
  levelId: String
) extends APIWithTokenMessage[Level] {
  override def token: String = playerId

  /** 获取单个已发布关卡；未发布或不存在均返回 LEVEL_NOT_FOUND。
    *
    * 实现：requireRole(Player) → LevelApiSupport.publishedLevel → RowMapper。
    * 关联：供玩家详情页与游戏引擎加载关卡数据。
    */
  override def plan(connection: Connection): IO[Either[HttpError, Level]] =
    IO.pure(
      AccessControl.requireRole(connection, playerId, UserRole.Player)
        .flatMap(_ => LevelApiSupport.publishedLevel(connection, levelId).map(LevelRowMapper.toLevel))
    )
}
