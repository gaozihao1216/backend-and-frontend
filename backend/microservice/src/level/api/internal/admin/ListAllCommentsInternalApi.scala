package microservice.level.api.internal.admin

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.objects.social.LevelComment
import microservice.level.support.admin.CommentAdminSupport

/** 模块间 API：列出全部评论；由 admin HTTP API 调用，不挂路由。 */
final case class ListAllCommentsInternalAPIMessage() extends APIMessage[List[LevelComment]] {
  override def plan(connection: Connection): IO[Either[HttpError, List[LevelComment]]] =
    PlanSteps.finish {
      PlanSteps.read(CommentAdminSupport.listAll(connection))
    }
}
