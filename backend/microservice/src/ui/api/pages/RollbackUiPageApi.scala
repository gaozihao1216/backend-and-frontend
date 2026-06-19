package microservice.ui.api.pages

import cats.effect.IO
import java.sql.Connection
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel
import microservice.ui.objects.PageConfig

/** 总监回滚页面配置 APIMessage；恢复上一版已发布快照。
  *
  * 定义：POST /admin/director/ui/pages/:pageId/rollback。
  * 作用：从 UiPageRollbackTable 读取快照写回 UiPageTable 并删除快照。
  * 关联：UiPagePublishSupport.rollback；无快照时返回 PageRollbackUnavailable。
  */
final case class RollbackUiPageAPIMessage(
  userId: String,
  pageId: String
) extends APIWithTokenMessage[PageConfig] {
  override def token: String = userId

  /** 恢复上一版已发布配置。
    *
    * 实现：requireAdminLevel(Director) → UiPagePublishSupport.rollback。
    * 关联：回滚成功后快照被删除，不可重复回滚。
    */
  override def plan(connection: Connection): IO[Either[HttpError, PageConfig]] =
    PlanSteps.finish {
      for {
        // 校验总监权限
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ()))
        // 委托 UiPagePublishSupport 完成回滚
        page <- PlanSteps.require(UiPagePublishSupport.rollback(connection, pageId))
      } yield page
    }
}
