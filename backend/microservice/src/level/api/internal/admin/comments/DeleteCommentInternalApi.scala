package microservice.level.api.internal.admin.comments

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.objects.social.LevelComment
import microservice.level.tables.comment.CommentTable
import microservice.level.tables.shared.LevelRowMapper

/** 模块间 API：按 id 删除评论；由 admin HTTP API 调用，不挂路由。 */
final case class DeleteCommentInternalAPIMessage(commentId: String) extends APIMessage[LevelComment] {
  override def plan(connection: Connection): IO[Either[HttpError, LevelComment]] =
    PlanSteps.finish {
      EitherT.liftF(IO(CommentTable.deleteById(connection, commentId))).flatMap {
        case None =>
          EitherT.leftT[IO, LevelComment](HttpError.notFound("COMMENT_NOT_FOUND", "Comment not found"))
        case Some(row) =>
          EitherT.rightT[IO, HttpError](LevelRowMapper.toComment(row))
      }
    }
}
