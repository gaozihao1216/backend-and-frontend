package microservice.admin.api.comments

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.user.utils.AccessControl
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.objects.social.LevelComment
import microservice.level.tables.comment.CommentTable
import microservice.system.objects.AdminLevel

/** 获取全部关卡评论列表，供 Standard 管理员在后台浏览与删除。 */
final case class GetAdminCommentsAPIMessage(userId: String) extends APIWithTokenMessage[List[LevelComment]] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, List[LevelComment]]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard).map(_ => ()))
        comments <- PlanSteps.read(CommentTable.listAllForAdmin(connection).map(LevelRowMapper.toComment).toList)
      } yield comments
    }
}
