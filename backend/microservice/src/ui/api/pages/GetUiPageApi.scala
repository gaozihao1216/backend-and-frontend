package microservice.ui.api.pages

import cats.effect.IO
import java.sql.Connection
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel
import microservice.ui.objects.{PageConfig, UiCustomizationErrors}
import microservice.ui.tables.ui_page.{UiPageRowMapper, UiPageTable}

/** 总监按 pageId 读取单页配置 APIMessage。
  *
  * 定义：GET /admin/director/ui/pages/:pageId。
  * 作用：返回完整 PageConfig（含 layout 与 components）。
  * 关联：DirectorWorkbench 编辑页加载；404 映射 PageNotFound。
  */
final case class GetUiPageAPIMessage(
  userId: String,
  pageId: String
) extends APIWithTokenMessage[PageConfig] {
  override def token: String = userId

  /** 按 pageId 读取单页配置。
    *
    * 实现：requireAdminLevel(Director) → UiPageTable.findById → RowMapper 转 PageConfig。
    * 关联：页面不存在时返回 UI_PAGE_NOT_FOUND。
    */
  override def plan(connection: Connection): IO[Either[HttpError, PageConfig]] =
    PlanSteps.finish {
      for {
        // 校验总监权限
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ()))
        // 查找页面并转为 PageConfig
        page <- PlanSteps.require(
          UiPageTable.findById(connection, pageId)
            .map(UiPageRowMapper.toPageConfig)
            .toRight(UiCustomizationErrors.PageNotFound(pageId).toHttpError)
        )
      } yield page
    }
}
