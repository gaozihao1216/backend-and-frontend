package microservice.ui.api.stretchtemplates

import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel
import microservice.ui.objects.{StretchVisualTemplate, StretchVisualTemplateKind, UiCustomizationErrors}
import microservice.ui.tables.stretch_visual_template.{StretchVisualTemplateRowMapper, StretchVisualTemplateTable}

/** 总监更新拉伸视觉模板 APIMessage。
  *
  * 定义：PUT /panel-templates/:id 或 /pattern-templates/:id。
  * 作用：校验 kind 匹配后 update StretchVisualTemplateTable。
  * 关联：UpdateStretchVisualTemplateBody.template。
  */
final case class UpdateStretchVisualTemplateAPIMessage(
  userId: String,
  templateId: String,
  expectedKind: StretchVisualTemplateKind,
  body: UpdateStretchVisualTemplateBody
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
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ()))
        // 查找现有行并校验 kind
        existing <- PlanSteps.require(
          StretchVisualTemplateTable.findById(connection, templateId) match {
            case None =>
              Left(UiCustomizationErrors.StretchVisualTemplateNotFound(templateId).toHttpError)
            case Some(row) if row.kind != expectedKind =>
              Left(UiCustomizationErrors.StretchVisualTemplateKindMismatch(expectedKind.value, row.kind.value).toHttpError)
            case Some(row) =>
              Right(row)
          }
        )
        // 规范化模板字段
        template <- PlanSteps.read(
          StretchVisualTemplateValidation.sanitize(body.template.copy(id = templateId, kind = expectedKind))
        )
        // 校验 kind 一致
        validated <- PlanSteps.require(StretchVisualTemplateValidation.ensureKind(template, expectedKind))
        // 校验字段合法性
        _ <- PlanSteps.require(StretchVisualTemplateValidation.validate(validated).map(_ => ()))
        // 更新 StretchVisualTemplateRow
        result <- PlanSteps.require(
          StretchVisualTemplateTable
            .update(
              connection,
              StretchVisualTemplateRowMapper.fromStretchVisualTemplate(
                validated,
                createdAt = existing.createdAt,
                updatedAt = Instant.now().toString
              )
            )
            .map(row => Right(StretchVisualTemplateRowMapper.toStretchVisualTemplate(row)))
            .getOrElse(Left(UiCustomizationErrors.StretchVisualTemplateNotFound(templateId).toHttpError))
        )
      } yield result
    }
}
