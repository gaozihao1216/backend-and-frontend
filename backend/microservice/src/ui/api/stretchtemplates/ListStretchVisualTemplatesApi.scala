package microservice.ui.api.stretchtemplates

import cats.effect.IO
import java.sql.Connection
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel
import microservice.ui.objects.{StretchVisualTemplate, StretchVisualTemplateKind}
import microservice.ui.tables.stretch_visual_template.{StretchVisualTemplateRowMapper, StretchVisualTemplateTable}

/** GET panel-templates 或 pattern-templates 的 APIMessage；由 kind 区分资源类型。 */
final case class ListStretchVisualTemplatesAPIMessage(
  userId: String,
  kind: StretchVisualTemplateKind
) extends APIWithTokenMessage[List[StretchVisualTemplate]] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, List[StretchVisualTemplate]]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ()))
        templates <- PlanSteps.read(
          StretchVisualTemplateTable
            .listByKind(connection, kind)
            .map(StretchVisualTemplateRowMapper.toStretchVisualTemplate)
            .toList
        )
      } yield templates
    }
}
