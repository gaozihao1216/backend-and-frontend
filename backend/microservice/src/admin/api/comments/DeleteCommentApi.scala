package microservice.admin.api.comments

import cats.effect.IO
import java.sql.Connection
import microservice.admin.objects.level.AdminLevelComment
import microservice.admin.support.mapping.LevelHandoffMapping
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.user.support.AccessControl
import microservice.level.api.internal.admin.comments.DeleteCommentInternalAPIMessage
import microservice.system.objects.enums.AdminLevel

/** 按 ID 删除单条关卡评论 APIMessage。 */
final case class DeleteCommentAPIMessage(
  userId: String,
  commentId: String
) extends APIWithTokenMessage[AdminLevelComment] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, AdminLevelComment]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.fromEither(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard))
        comment <- PlanSteps.runApi(DeleteCommentInternalAPIMessage(commentId), connection)
      } yield LevelHandoffMapping.toLevelComment(comment)
    }
}
