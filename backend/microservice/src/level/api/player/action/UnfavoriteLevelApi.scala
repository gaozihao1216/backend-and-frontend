package microservice.level.api.player.action

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.user.support.AccessControl
import microservice.level.objects.social.Favorite
import microservice.level.support.player.LevelApiSupport
import microservice.system.objects.enums.UserRole

final case class UnfavoriteLevelAPIMessage(
  playerId: String,
  levelId: String
) extends APIWithTokenMessage[Favorite] {
  override def token: String = playerId
  /** plan 定义了什么业务流程：UnfavoriteLevel 对应的业务流程。
    *
    * 解决了什么问题：封装该 API 的业务规则与数据访问。
    * 在事务内起到什么作用：在 DatabaseSession 事务内执行；Left 时回滚。
    * 关联的前端 API：前端同名 API 文件。
    */

  override def plan(connection: Connection): IO[Either[HttpError, Favorite]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验调用者为 Player
        _ <- AccessControl.requireRole(connection, playerId, UserRole.Player).map(_ => ())
        // 步骤 2：确认关卡已发布
        _ <- LevelApiSupport.requirePublishedLevel(connection, levelId).map(_ => ())
        // 步骤 3：删除收藏记录并返回被删 Favorite
        favorite <- LevelApiSupport.requireDeletedFavorite(connection, playerId, levelId)
      } yield favorite
    }
}
