package microservice.ui.api.stretchtemplates

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import java.sql.Connection
import java.time.Instant
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel
import microservice.ui.objects.{StretchVisualTemplate, StretchVisualTemplateKind, UiCustomizationErrors}
import microservice.ui.tables.stretch_visual_template.{StretchVisualTemplateRowMapper, StretchVisualTemplateTable}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** PUT panel-templates/:id 或 pattern-templates/:id 的请求体。 */
final case class UpdateStretchVisualTemplateBody(
  template: StretchVisualTemplate
)

object UpdateStretchVisualTemplateBody {
  implicit val encoder: Encoder[UpdateStretchVisualTemplateBody] = deriveEncoder
  implicit val decoder: Decoder[UpdateStretchVisualTemplateBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, UpdateStretchVisualTemplateBody] = jsonOf
}

/** 更新拉伸视觉模板的 APIMessage；校验 kind 与路由一致。 */
final case class UpdateStretchVisualTemplateAPIMessage(
  userId: String,
  templateId: String,
  expectedKind: StretchVisualTemplateKind,
  body: UpdateStretchVisualTemplateBody
) extends APIWithTokenMessage[StretchVisualTemplate] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, StretchVisualTemplate]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ()))
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
        template <- PlanSteps.read(
          StretchVisualTemplateValidation.sanitize(body.template.copy(id = templateId, kind = expectedKind))
        )
        validated <- PlanSteps.require(StretchVisualTemplateValidation.ensureKind(template, expectedKind))
        _ <- PlanSteps.require(StretchVisualTemplateValidation.validate(validated).map(_ => ()))
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
