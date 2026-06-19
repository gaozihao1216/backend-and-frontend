package microservice.level.api.player.action

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.user.utils.AccessControl
import microservice.level.objects.social.Favorite
import microservice.level.tables.favorite.FavoriteTable
import microservice.level.support.player.LevelApiSupport
import microservice.system.objects.UserRole

final case class UnfavoriteLevelAPIMessage(
  playerId: String,
  levelId: String
) extends APIWithTokenMessage[Favorite] {
  override def token: String = playerId
  /** plan 定义了什么业务流程：UnfavoriteLevel 对应的业务流程。
    *
    * 解决了什么问题：封装该 API 的业务规则与数据访问。
    * 在事务内起到什么作用：在 DatabaseSession 事务内执行；Left 时回滚。
    * 关联的 HTTP 路由/前端 API：见 routes 中对应路径；前端同名 API 文件。
    */

  override def plan(connection: Connection): IO[Either[HttpError, Favorite]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验用户角色/管理员级别权限
        _ <- PlanSteps.require(AccessControl.requireRole(connection, playerId, UserRole.Player).map(_ => ()))
        // 步骤 2：执行业务步骤
        _ <- PlanSteps.require(LevelApiSupport.publishedLevel(connection, levelId).map(_ => ()))
        // 步骤 3：执行业务步骤
        favorite <- PlanSteps.require(
          FavoriteTable
            .delete(connection, playerId, levelId)
            .toRight(HttpError.notFound("FAVORITE_NOT_FOUND", "Favorite not found"))
        )
      // 返回业务结果 DTO/领域对象
      } yield favorite
    }
}
