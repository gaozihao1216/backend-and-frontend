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

/** 创建拉伸视觉模板的 APIMessage；Router 传入 expectedKind 强制与路由一致。 */
final case class CreateStretchVisualTemplateAPIMessage(
  userId: String,
  expectedKind: StretchVisualTemplateKind,
  body: CreateStretchVisualTemplateBody
) extends APIWithTokenMessage[StretchVisualTemplate] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, StretchVisualTemplate]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ()))
        template <- PlanSteps.read(StretchVisualTemplateValidation.sanitize(body.template.copy(kind = expectedKind)))
        validated <- PlanSteps.require(StretchVisualTemplateValidation.ensureKind(template, expectedKind))
        _ <- PlanSteps.require(StretchVisualTemplateValidation.validate(validated).map(_ => ()))
        _ <- PlanSteps.require(
          if (StretchVisualTemplateTable.findById(connection, template.id).nonEmpty) {
            Left(UiCustomizationErrors.StretchVisualTemplateAlreadyExists(template.id).toHttpError)
          } else {
            Right(())
          }
        )
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
