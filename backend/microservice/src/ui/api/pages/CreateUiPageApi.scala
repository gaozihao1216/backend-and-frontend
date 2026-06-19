package microservice.ui.api.pages

import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel
import microservice.ui.objects.{PageConfig, UiCustomizationErrors}
import microservice.ui.tables.ui_page.{UiPageRowMapper, UiPageTable}

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
        // 校验总监权限
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ()))
        // id 不可重复；id/name/path 不可为空
        _ <- PlanSteps.require(
          if (UiPageTable.findById(connection, body.page.id).nonEmpty) {
            Left(UiCustomizationErrors.PageAlreadyExists(body.page.id).toHttpError)
          } else if (body.page.id.trim.isEmpty || body.page.name.trim.isEmpty || body.page.path.trim.isEmpty) {
            Left(UiCustomizationErrors.InvalidPageConfig("id, name and path are required").toHttpError)
          } else {
            Right(())
          }
        )
        // 组装 UiPageRow 并插入；RowMapper 转领域对象 PageConfig
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
