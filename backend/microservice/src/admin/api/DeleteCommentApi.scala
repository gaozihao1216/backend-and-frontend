
package microservice.admin.api

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage}
import microservice.infrastructure.http.{HttpError}
import microservice.user.utils.AccessControl
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.objects.LevelComment
import microservice.level.tables.comment.CommentTable
import microservice.system.objects.AdminLevel

/** 按 ID 删除单条关卡评论。
  *
  * 实现：requireAdminLevel(Standard) → CommentTable.deleteById；未找到则 COMMENT_NOT_FOUND。
  * 关联：DELETE /admin/comments/:commentId；返回被删除的 LevelComment 供前端确认。
  */
final case class DeleteCommentAPIMessage(
  userId: String,
  commentId: String
) extends APIWithTokenMessage[LevelComment] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, LevelComment]] =
    IO.pure(
      AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard).flatMap { _ =>
        CommentTable.deleteById(connection, commentId)
          .map(LevelRowMapper.toComment)
          .toRight(HttpError.notFound("COMMENT_NOT_FOUND", "Comment not found"))
      }
    )
}
