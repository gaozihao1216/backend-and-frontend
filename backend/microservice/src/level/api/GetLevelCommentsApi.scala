package microservice.level.api

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage}
import microservice.infrastructure.http.{HttpError}
import microservice.user.utils.AccessControl
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.objects.LevelComment
import microservice.level.tables.comment.CommentTable
import microservice.level.utils.LevelApiSupport
import microservice.system.objects.UserRole

/** GET /player/levels/:levelId/comments 的 APIMessage：返回关卡评论列表。 */
final case class GetLevelCommentsAPIMessage(
  playerId: String,
  levelId: String
) extends APIWithTokenMessage[List[LevelComment]] {
  override def token: String = playerId

  /** 列出指定已发布关卡的全部评论。
    *
    * 实现：requireRole(Player) → 校验关卡已发布 → CommentTable.listByLevel → RowMapper。
    * 关联：CreateCommentAPIMessage 写入；admin DeleteCommentAPIMessage 删除。
    */
  override def plan(connection: Connection): IO[Either[HttpError, List[LevelComment]]] =
    IO.pure(
      AccessControl.requireRole(connection, playerId, UserRole.Player)
        .flatMap(_ =>
          LevelApiSupport.publishedLevel(connection, levelId).map(_ =>
            CommentTable.listByLevel(connection, levelId).map(LevelRowMapper.toComment).toList
          )
        )
    )
}
