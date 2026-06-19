package microservice.ui.api.buttontemplates

import cats.effect.IO
import java.sql.Connection
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel
import microservice.ui.objects.{ButtonTemplate, UiCustomizationErrors}
import microservice.ui.tables.button_template.{ButtonTemplateRowMapper, ButtonTemplateTable}

/** 总监删除按钮模板 APIMessage；返回被删模板。
  *
  * 定义：/admin/director/ui/button-templates 相关路由。
  * 作用：按钮视觉模板的 CRUD 操作之一。
  * 关联：ButtonTemplateTable；DirectorWorkbench 按钮模板管理。
  */
final case class DeleteButtonTemplateAPIMessage(
  userId: String,
  templateId: String
) extends APIWithTokenMessage[ButtonTemplate] {
  override def token: String = userId

  /** 执行按钮模板业务逻辑。
    *
    * 实现：requireAdminLevel(Director) → deleteById → RowMapper。
    * 关联：userId 取自 header。
    */
  override def plan(connection: Connection): IO[Either[HttpError, ButtonTemplate]] =
    PlanSteps.finish {
      for {
        // 校验总监权限
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ()))
        // 删除并返回被删 ButtonTemplate
        template <- PlanSteps.require(
          ButtonTemplateTable.deleteById(connection, templateId)
            .map(ButtonTemplateRowMapper.toButtonTemplate)
            .toRight(UiCustomizationErrors.ButtonTemplateNotFound(templateId).toHttpError)
        )
      } yield template
    }
}
