package microservice.level.api.internal.admin

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.objects.social.LevelComment
import microservice.level.support.admin.CommentAdminSupport

/** 模块间 API：按 id 删除评论；由 admin HTTP API 调用，不挂路由。 */
final case class DeleteCommentInternalAPIMessage(commentId: String) extends APIMessage[LevelComment] {
  override def plan(connection: Connection): IO[Either[HttpError, LevelComment]] =
    PlanSteps.finish {
      CommentAdminSupport.requireDeleteById(connection, commentId)
    }
}
