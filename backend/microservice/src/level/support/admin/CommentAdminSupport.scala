package microservice.level.support.admin

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.level.objects.social.LevelComment
import microservice.level.tables.comment.CommentTable
import microservice.level.tables.shared.LevelRowMapper

/** 管理员评论读写的 level 模块内实现。 */
object CommentAdminSupport {
  def listAll(connection: Connection): List[LevelComment] =
    CommentTable.listAllForAdmin(connection).map(LevelRowMapper.toComment).toList

  def requireDeleteById(connection: Connection, commentId: String): Step[LevelComment] =
    EitherT.liftF(IO(CommentTable.deleteById(connection, commentId))).flatMap {
      case None =>
        EitherT.leftT(HttpError.notFound("COMMENT_NOT_FOUND", "Comment not found"))
      case Some(row) =>
        EitherT.rightT(LevelRowMapper.toComment(row))
    }
}
