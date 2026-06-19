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

/** 总监创建拉伸视觉模板 APIMessage；Router 注入 expectedKind。
  *
  * 定义：POST /panel-templates 或 /pattern-templates。
  * 作用：强制 kind 与路由一致后写入 StretchVisualTemplateTable。
  * 关联：PanelComponent / 装饰图案引用 templateId。
  */
final case class CreateStretchVisualTemplateAPIMessage(
  userId: String,
  expectedKind: StretchVisualTemplateKind,
  body: CreateStretchVisualTemplateBody
) extends APIWithTokenMessage[StretchVisualTemplate] {
  override def token: String = userId

  /** 创建拉伸视觉模板。
    *
    * 实现：requireAdminLevel(Director) → sanitize → ensureKind → validate → 查重 → insert。
    * 关联：expectedKind 由 Router 按 panel/pattern 路由注入。
    */
  override def plan(connection: Connection): IO[Either[HttpError, StretchVisualTemplate]] =
    PlanSteps.finish {
      for {
        // 校验总监权限
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ()))
        // 规范化并按路由强制 kind
        template <- PlanSteps.read(StretchVisualTemplateValidation.sanitize(body.template.copy(kind = expectedKind)))
        // 二次校验 kind 与路由一致
        validated <- PlanSteps.require(StretchVisualTemplateValidation.ensureKind(template, expectedKind))
        // 校验 id/name/sourceDataUrl/category
        _ <- PlanSteps.require(StretchVisualTemplateValidation.validate(validated).map(_ => ()))
        // id 不可重复
        _ <- PlanSteps.require(
          if (StretchVisualTemplateTable.findById(connection, template.id).nonEmpty) {
            Left(UiCustomizationErrors.StretchVisualTemplateAlreadyExists(template.id).toHttpError)
          } else {
            Right(())
          }
        )
        // 插入 StretchVisualTemplateRow
        result <- PlanSteps.read {
          val timestamp = Instant.now().toString
          val row = StretchVisualTemplateTable.insert(
            connection,
            StretchVisualTemplateRowMapper.fromStretchVisualTemplate(template, createdAt = timestamp, updatedAt = timestamp)
          )
          StretchVisualTemplateRowMapper.toStretchVisualTemplate(row)
        }
      } yield result
    }
}
