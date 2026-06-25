package microservice.level.api.internal.admin

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.objects.social.LevelComment
import microservice.level.tables.comment.CommentTable
import microservice.level.tables.shared.LevelRowMapper

/** 模块间 API：列出全部评论；由 admin HTTP API 调用，不挂路由。 */
final case class ListAllCommentsInternalAPIMessage() extends APIMessage[List[LevelComment]] {
  override def plan(connection: Connection): IO[Either[HttpError, List[LevelComment]]] =
    PlanSteps.finish {
      PlanSteps.read(CommentTable.listAllForAdmin(connection).map(LevelRowMapper.toComment).toList)
    }
}
