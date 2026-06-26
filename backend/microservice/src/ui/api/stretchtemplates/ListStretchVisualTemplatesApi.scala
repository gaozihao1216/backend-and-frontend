package microservice.ui.api.stretchtemplates

import cats.effect.IO
import java.sql.Connection
import microservice.user.support.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.enums.AdminLevel
import microservice.ui.objects.stretch_template.StretchVisualTemplate
import microservice.ui.objects.stretch_template.StretchVisualTemplateKind
import microservice.ui.tables.stretch_visual_template.{StretchVisualTemplateRowMapper, StretchVisualTemplateTable}

/** 总监按 kind 列出拉伸视觉模板 APIMessage。
  *
  * 定义：GET /panel-templates 或 /pattern-templates。
  * 作用：StretchVisualTemplateTable.listByKind 过滤返回。
  * 关联：kind 由 Router 按路径注入 Panel 或 Pattern。
  */
final case class ListStretchVisualTemplatesAPIMessage(
  userId: String,
  kind: StretchVisualTemplateKind
) extends APIWithTokenMessage[List[StretchVisualTemplate]] {
  override def token: String = userId

  /** 按 kind 列出拉伸视觉模板。
    *
    * 实现：requireAdminLevel(Director) → listByKind → RowMapper 批量转换。
    * 关联：expectedKind 由 Router 按 panel/pattern 路由注入。
    */
  override def plan(connection: Connection): IO[Either[HttpError, List[StretchVisualTemplate]]] =
    PlanSteps.finish {
      for {
        // 校验总监权限
        _ <- PlanSteps.fromEither(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director))
        // 按 kind 过滤列出模板
        templates <- PlanSteps.read(
          StretchVisualTemplateTable
            .listByKind(connection, kind)
            .map(StretchVisualTemplateRowMapper.toStretchVisualTemplate)
            .toList
        )
      } yield templates
    }
}
