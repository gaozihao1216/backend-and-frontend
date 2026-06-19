package microservice.level.api.player.read

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.user.utils.AccessControl
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.objects.level.Level
import microservice.level.support.player.LevelApiSupport
import microservice.system.objects.UserRole

final case class GetPublishedLevelAPIMessage(
  playerId: String,
  levelId: String
) extends APIWithTokenMessage[Level] {
  override def token: String = playerId
  /** plan 定义了什么业务流程：GetPublishedLevel 对应的业务流程。
    *
    * 解决了什么问题：封装该 API 的业务规则与数据访问。
    * 在事务内起到什么作用：在 DatabaseSession 事务内执行；Left 时回滚。
    * 关联的 HTTP 路由/前端 API：见 routes 中对应路径；前端同名 API 文件。
    */

  override def plan(connection: Connection): IO[Either[HttpError, Level]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验用户角色/管理员级别权限
        _ <- PlanSteps.require(AccessControl.requireRole(connection, playerId, UserRole.Player).map(_ => ()))
        // 步骤 2：执行业务步骤
        levelRow <- PlanSteps.require(LevelApiSupport.publishedLevel(connection, levelId))
      // 返回业务结果 DTO/领域对象
      } yield LevelRowMapper.toLevel(levelRow)
    }
}
