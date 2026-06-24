package microservice.ui.api.buttontemplates

import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.user.support.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel
import microservice.ui.objects.button_template.ButtonTemplate
import microservice.ui.objects.UiCustomizationErrors
import microservice.ui.tables.button_template.{ButtonTemplateRowMapper, ButtonTemplateTable}
import microservice.ui.body.buttontemplates.CreateButtonTemplateBody
import microservice.ui.support.buttontemplates.ButtonTemplateAccess
import microservice.ui.validation.buttontemplates.ButtonTemplateValidation

/** 总监创建按钮视觉模板 APIMessage。
  *
  * 定义：POST /admin/director/ui/button-templates。
  * 作用：sanitize → validate → 查重 → ButtonTemplateTable.insert。
  * 关联：ButtonComponent.baseDesign 可引用 templateId；前端 objects/ui/buttonTemplate.ts。
  */
final case class CreateButtonTemplateAPIMessage(
  userId: String,
  body: CreateButtonTemplateBody
) extends APIWithTokenMessage[ButtonTemplate] {
  override def token: String = userId

  /** 创建按钮模板。
    *
    * 实现：requireAdminLevel(Director) → sanitize → 查重 → validate → insert → RowMapper。
    * 关联：CreateButtonTemplateBody.template 为完整 ButtonTemplate。
    */
  override def plan(connection: Connection): IO[Either[HttpError, ButtonTemplate]] =
    PlanSteps.finish {
      for {
        // 校验总监权限
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ())
        // 规范化字符串字段
        template <- PlanSteps.read(ButtonTemplateValidation.sanitize(body.template))
        // id 不可重复
        _ <- ButtonTemplateAccess.requireUniqueId(connection, template.id)
        // 校验 id/name/sourceDataUrl/category/slice
        _ <- ButtonTemplateValidation.validate(template)
        // 插入 ButtonTemplateRow 并转为领域对象
        result <- PlanSteps.read {
          val timestamp = Instant.now().toString
          val row = ButtonTemplateTable.insert(
            connection,
            ButtonTemplateRowMapper.fromButtonTemplate(template, createdAt = timestamp, updatedAt = timestamp)
          )
          ButtonTemplateRowMapper.toButtonTemplate(row)
        }
      } yield result
    }
}
