package microservice.admin.api.comments

import cats.effect.IO
import java.sql.Connection
import microservice.admin.objects.level.AdminLevelComment
import microservice.admin.support.mapping.LevelHandoffMapping
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.user.utils.AccessControl
import microservice.level.api.internal.admin.ListAllCommentsInternalAPIMessage
import microservice.system.objects.AdminLevel

/** 获取全部关卡评论列表 APIMessage，供 Standard 管理员在后台浏览与删除。 */
final case class GetAdminCommentsAPIMessage(userId: String) extends APIWithTokenMessage[List[AdminLevelComment]] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, List[AdminLevelComment]]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard).map(_ => ())
        comments <- PlanSteps.runApi(ListAllCommentsInternalAPIMessage(), connection)
      } yield comments.map(LevelHandoffMapping.toLevelComment)
    }
}
