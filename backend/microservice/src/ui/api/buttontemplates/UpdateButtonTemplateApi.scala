package microservice.ui.api.buttontemplates

import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.user.support.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.enums.AdminLevel
import microservice.ui.objects.button_template.ButtonTemplate
import microservice.ui.objects.errors.UiCustomizationErrors
import microservice.ui.tables.button_template.{ButtonTemplateRowMapper, ButtonTemplateTable}
import microservice.ui.objects.button_template.request.UpdateButtonTemplateRequest
import microservice.ui.support.buttontemplates.ButtonTemplateAccess
import microservice.ui.validation.buttontemplates.ButtonTemplateValidation

/** 总监更新按钮模板 APIMessage。
  *
  * 定义：/admin/director/ui/button-templates 相关路由。
  * 作用：按钮视觉模板的 CRUD 操作之一。
  * 关联：ButtonTemplateTable；DirectorWorkbench 按钮模板管理。
  */
final case class UpdateButtonTemplateAPIMessage(
  userId: String,
  templateId: String,
  body: UpdateButtonTemplateRequest
) extends APIWithTokenMessage[ButtonTemplate] {
  override def token: String = userId

  /** 执行按钮模板业务逻辑。
    *
    * 实现：requireAdminLevel(Director) → findById → sanitize → validate → update。
    * 关联：userId 取自 header。
    */
  override def plan(connection: Connection): IO[Either[HttpError, ButtonTemplate]] =
    PlanSteps.finish {
      for {
        // 校验总监权限
        _ <- PlanSteps.fromEither(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director))
        // 查找现有模板行
        existing <- PlanSteps.fromEither(ButtonTemplateAccess.requireExisting(connection, templateId))
        // 规范化并强制 id 为路径 templateId
        template <- PlanSteps.read(ButtonTemplateValidation.sanitize(body.template.copy(id = templateId)))
        // 校验字段合法性
        _ <- PlanSteps.fromEither(ButtonTemplateValidation.validate(template))
        // 更新 ButtonTemplateRow
        result <- PlanSteps.fromEither(
          ButtonTemplateAccess.requireUpdated(
            connection,
            ButtonTemplateRowMapper.fromButtonTemplate(
              template,
              createdAt = existing.createdAt,
              updatedAt = Instant.now().toString
            )
          )
        )
      } yield result
    }
}
