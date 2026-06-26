package microservice.ui.api.stretchtemplates

import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.user.support.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.enums.AdminLevel
import microservice.ui.objects.stretch_template.StretchVisualTemplate
import microservice.ui.objects.stretch_template.StretchVisualTemplateKind
import microservice.ui.objects.errors.UiCustomizationErrors
import microservice.ui.tables.stretch_visual_template.{StretchVisualTemplateRowMapper, StretchVisualTemplateTable}
import microservice.ui.objects.stretch_template.request.UpdateStretchVisualTemplateRequest
import microservice.ui.support.stretchtemplates.StretchVisualTemplateAccess
import microservice.ui.validation.stretchtemplates.StretchVisualTemplateValidation

/** 总监更新拉伸视觉模板 APIMessage。
  *
  * 定义：PUT /panel-templates/:id 或 /pattern-templates/:id。
  * 作用：校验 kind 匹配后 update StretchVisualTemplateTable。
  * 关联：UpdateStretchVisualTemplateRequest.template。
  */
final case class UpdateStretchVisualTemplateAPIMessage(
  userId: String,
  templateId: String,
  expectedKind: StretchVisualTemplateKind,
  body: UpdateStretchVisualTemplateRequest
) extends APIWithTokenMessage[StretchVisualTemplate] {
  override def token: String = userId

  /** 更新拉伸视觉模板。
    *
    * 实现：requireAdminLevel(Director) → findById → sanitize → ensureKind → validate → update。
    * 关联：expectedKind 由 Router 按 panel/pattern 路由注入。
    */
  override def plan(connection: Connection): IO[Either[HttpError, StretchVisualTemplate]] =
    PlanSteps.finish {
      for {
        // 校验总监权限
        _ <- PlanSteps.fromEither(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director))
        // 查找现有行并校验 kind
        existing <- PlanSteps.fromEither(
          StretchVisualTemplateAccess.requireExistingForKind(connection, templateId, expectedKind)
        )
        // 规范化模板字段
        template <- PlanSteps.read(
          StretchVisualTemplateValidation.sanitize(body.template.copy(id = templateId, kind = expectedKind))
        )
        // 校验 kind 一致
        validated <- PlanSteps.fromEither(StretchVisualTemplateValidation.ensureKind(template, expectedKind))
        // 校验字段合法性
        _ <- PlanSteps.fromEither(StretchVisualTemplateValidation.validate(validated))
        // 更新 StretchVisualTemplateRow
        result <- PlanSteps.fromEither(
          StretchVisualTemplateAccess.requireUpdated(
            connection,
            StretchVisualTemplateRowMapper.fromStretchVisualTemplate(
              validated,
              createdAt = existing.createdAt,
              updatedAt = Instant.now().toString
            )
          )
        )
      } yield result
    }
}
