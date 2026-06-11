package microservice.level.api

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage}
import microservice.infrastructure.http.{HttpError}
import microservice.user.utils.AccessControl
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.objects.Level
import microservice.level.tables.level.LevelTable
import microservice.system.objects.LevelTag
import microservice.system.objects.UserRole

/** GET /player/levels 的 APIMessage：返回已发布关卡列表。 */
final case class GetPublishedLevelsAPIMessage(
  playerId: String,
  tag: Option[LevelTag],
  sort: String
) extends APIWithTokenMessage[List[Level]] {
  override def token: String = playerId

  /** 列出已发布关卡，支持按 tag 筛选与 sort 排序。
    *
    * 实现：requireRole(Player) → LevelTable.listPublished → RowMapper 批量转换。
    * 关联：PlayerLevelReadRouter 从 query 参数解析 tag/sort 后传入。
    */
  override def plan(connection: Connection): IO[Either[HttpError, List[Level]]] =
    IO.pure {
      AccessControl.requireRole(connection, playerId, UserRole.Player).map { _ =>
        LevelTable.listPublished(connection, tag, sort).map(LevelRowMapper.toLevel).toList
      }
    }
}
