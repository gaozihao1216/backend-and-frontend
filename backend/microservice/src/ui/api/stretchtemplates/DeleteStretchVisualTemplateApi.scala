package microservice.ui.api.stretchtemplates

import cats.effect.IO
import java.sql.Connection
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel
import microservice.ui.objects.{StretchVisualTemplate, StretchVisualTemplateKind, UiCustomizationErrors}
import microservice.ui.tables.stretch_visual_template.{StretchVisualTemplateRowMapper, StretchVisualTemplateTable}

/** 总监删除拉伸视觉模板 APIMessage。
  *
  * 定义：DELETE /panel-templates/:id 或 /pattern-templates/:id。
  * 作用：校验 kind 匹配后 deleteById。
  * 关联：返回被删 StretchVisualTemplate。
  */
final case class DeleteStretchVisualTemplateAPIMessage(
  userId: String,
  templateId: String,
  expectedKind: StretchVisualTemplateKind
) extends APIWithTokenMessage[StretchVisualTemplate] {
  override def token: String = userId

  /** 删除拉伸视觉模板。
    *
    * 实现：requireAdminLevel(Director) → findById 校验 kind → deleteById。
    * 关联：expectedKind 由 Router 按 panel/pattern 路由注入。
    */
  override def plan(connection: Connection): IO[Either[HttpError, StretchVisualTemplate]] =
    PlanSteps.finish {
      for {
        // 校验总监权限
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ()))
        // 查找并校验 kind 与路由一致
        _ <- PlanSteps.require(
          StretchVisualTemplateTable.findById(connection, templateId) match {
            case None =>
              Left(UiCustomizationErrors.StretchVisualTemplateNotFound(templateId).toHttpError)
            case Some(existing) if existing.kind != expectedKind =>
              Left(UiCustomizationErrors.StretchVisualTemplateKindMismatch(expectedKind.value, existing.kind.value).toHttpError)
            case Some(_) =>
              Right(())
          }
        )
        // 删除并返回被删模板
        template <- PlanSteps.require(
          StretchVisualTemplateTable
            .deleteById(connection, templateId)
            .map(StretchVisualTemplateRowMapper.toStretchVisualTemplate)
            .toRight(UiCustomizationErrors.StretchVisualTemplateNotFound(templateId).toHttpError)
        )
      } yield template
    }
}
