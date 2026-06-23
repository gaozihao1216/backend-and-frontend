package microservice.ui.api.pages

import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel
import microservice.ui.objects.page.PageConfig
import microservice.ui.tables.ui_page.{UiPageRowMapper, UiPageTable}
import microservice.ui.api.pages.body.CreateUiPageBody
import microservice.ui.api.pages.support.UiPageAccess

/** 总监创建新 UI 页面配置 APIMessage；userId 取自 header。
  *
  * 定义：POST /admin/director/ui/pages 请求体为 CreateUiPageBody。
  * 作用：校验 id/name/path 后写入 UiPageTable，返回 PageConfig。
  * 关联：前端 objects/ui/pageConfig.ts 的 PageConfig schema 对齐返回结构。
  */
final case class CreateUiPageAPIMessage(
  userId: String,
  body: CreateUiPageBody
) extends APIWithTokenMessage[PageConfig] {
  override def token: String = userId

  /** 总监创建新页面配置，初始写入 UiPageTable。
    *
    * 实现：requireAdminLevel(Director) → 校验 id 唯一与必填字段 → UiPageTable.insert → RowMapper 转 PageConfig。
    * 关联：CreateUiPageBody.page 为完整 PageConfig；trim id/name/path 后持久化。
    */
  override def plan(connection: Connection): IO[Either[HttpError, PageConfig]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ())
        _ <- UiPageAccess.requireCreatePage(connection, body.page)
        page <- PlanSteps.read {
          val timestamp = Instant.now().toString
          val row = UiPageTable.insert(
            connection,
            UiPageRowMapper.fromPageConfig(body.page.copy(
              id = body.page.id.trim,
              name = body.page.name.trim,
              path = body.page.path.trim
            ), createdAt = timestamp, updatedAt = timestamp)
          )
          UiPageRowMapper.toPageConfig(row)
        }
      } yield page
    }
}
