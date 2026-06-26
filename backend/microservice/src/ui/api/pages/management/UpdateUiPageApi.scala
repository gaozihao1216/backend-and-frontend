package microservice.ui.api.pages.management

import cats.effect.IO
import java.sql.Connection
import microservice.user.support.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.enums.AdminLevel
import microservice.ui.objects.page.PageConfig
import microservice.ui.objects.page.request.UpdateUiPageRequest
import microservice.ui.support.pages.UiPageAccess

/** 总监更新或 upsert 页面配置 APIMessage。
  *
  * 定义：PUT /admin/director/ui/pages/:pageId；body 为 UpdateUiPageRequest。
  * 作用：存在则 update，不存在则 insert（upsert 语义）。
  * 关联：与 PublishUiPage 不同，不写入回滚快照。
  */
final case class UpdateUiPageAPIMessage(
  userId: String,
  pageId: String,
  body: UpdateUiPageRequest
) extends APIWithTokenMessage[PageConfig] {
  override def token: String = userId

  /** 更新或 upsert 页面配置。
    *
    * 实现：requireAdminLevel(Director) → 校验 name/path → findById 分支 insert/update。
    * 关联：路径 pageId 覆盖 body.page.id。
    */
  override def plan(connection: Connection): IO[Either[HttpError, PageConfig]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验总监权限
        _ <- PlanSteps.fromEither(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director))
        // 步骤 2：校验 name/path 等更新字段
        _ <- PlanSteps.fromEither(UiPageAccess.requireUpdateFields(body.page))
        // 步骤 3：按 pageId upsert 页面配置
        page <- PlanSteps.fromEither(UiPageAccess.requireUpsertPage(connection, pageId, body.page))
      } yield page
    }
}
