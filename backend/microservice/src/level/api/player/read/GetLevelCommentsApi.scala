package microservice.level.api.player.read

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.user.utils.AccessControl
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.objects.social.LevelComment
import microservice.level.tables.comment.CommentTable
import microservice.level.support.player.LevelApiSupport
import microservice.system.objects.UserRole

final case class GetLevelCommentsAPIMessage(
  playerId: String,
  levelId: String
) extends APIWithTokenMessage[List[LevelComment]] {
  override def token: String = playerId
  /** plan 定义了什么业务流程：GetLevelComments 对应的业务流程。
    *
    * 解决了什么问题：封装该 API 的业务规则与数据访问。
    * 在事务内起到什么作用：在 DatabaseSession 事务内执行；Left 时回滚。
    * 关联的前端 API：前端同名 API 文件。
    */

  override def plan(connection: Connection): IO[Either[HttpError, List[LevelComment]]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验用户角色/管理员级别权限
        _ <- AccessControl.requireRole(connection, playerId, UserRole.Player).map(_ => ())
        // 步骤 2：执行业务步骤
        _ <- LevelApiSupport.requirePublishedLevel(connection, levelId).map(_ => ())
        // 步骤 3：读取并组装数据
        comments <- PlanSteps.read(CommentTable.listByLevel(connection, levelId).map(LevelRowMapper.toComment).toList)
      } yield comments
    }
}
