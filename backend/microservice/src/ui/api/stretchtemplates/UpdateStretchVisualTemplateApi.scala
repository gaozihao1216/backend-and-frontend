package microservice.ui.api.stretchtemplates

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import java.sql.Connection
import java.time.Instant
import microservice.auth.utils.AccessControl
import microservice.infrastructure.api.APIWithTokenMessage
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel
import microservice.ui.objects.{StretchVisualTemplate, StretchVisualTemplateKind, UiCustomizationErrors}
import microservice.ui.tables.stretch_visual_template.{StretchVisualTemplateRowMapper, StretchVisualTemplateTable}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

final case class UpdateStretchVisualTemplateBody(
  template: StretchVisualTemplate
)

object UpdateStretchVisualTemplateBody {
  implicit val encoder: Encoder[UpdateStretchVisualTemplateBody] = deriveEncoder
  implicit val decoder: Decoder[UpdateStretchVisualTemplateBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, UpdateStretchVisualTemplateBody] = jsonOf
}

final case class UpdateStretchVisualTemplateAPIMessage(
  userId: String,
  templateId: String,
  expectedKind: StretchVisualTemplateKind,
  body: UpdateStretchVisualTemplateBody
) extends APIWithTokenMessage[StretchVisualTemplate] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, StretchVisualTemplate]] =
    IO.pure {
      AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).flatMap { _ =>
        StretchVisualTemplateTable.findById(connection, templateId) match {
          case None =>
            Left(UiCustomizationErrors.StretchVisualTemplateNotFound(templateId).toHttpError)
          case Some(existing) if existing.kind != expectedKind =>
            Left(UiCustomizationErrors.StretchVisualTemplateKindMismatch(expectedKind.value, existing.kind.value).toHttpError)
          case Some(existing) =>
            val template = StretchVisualTemplateValidation.sanitize(body.template.copy(id = templateId, kind = expectedKind))
            StretchVisualTemplateValidation.ensureKind(template, expectedKind).flatMap { validated =>
              StretchVisualTemplateValidation.validate(validated).flatMap { _ =>
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
              }
            }
        }
      }
    }
}
