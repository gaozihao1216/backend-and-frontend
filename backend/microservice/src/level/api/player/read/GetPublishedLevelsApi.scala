package microservice.level.api.player.read

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.user.utils.AccessControl
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.objects.level.Level
import microservice.level.tables.level.LevelTable
import microservice.system.objects.LevelTag
import microservice.system.objects.UserRole

final case class GetPublishedLevelsAPIMessage(
  playerId: String,
  tag: Option[LevelTag],
  sort: String
) extends APIWithTokenMessage[List[Level]] {
  override def token: String = playerId
  /** plan 定义了什么业务流程：GetPublishedLevels 对应的业务流程。
    *
    * 解决了什么问题：封装该 API 的业务规则与数据访问。
    * 在事务内起到什么作用：在 DatabaseSession 事务内执行；Left 时回滚。
    * 关联的 HTTP 路由/前端 API：见 routes 中对应路径；前端同名 API 文件。
    */

  override def plan(connection: Connection): IO[Either[HttpError, List[Level]]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验用户角色/管理员级别权限
        _ <- AccessControl.requireRole(connection, playerId, UserRole.Player).map(_ => ())
        // 步骤 2：读取并组装数据
        levels <- PlanSteps.read(LevelTable.listPublished(connection, tag, sort).map(LevelRowMapper.toLevel).toList)
      } yield levels
    }
}
