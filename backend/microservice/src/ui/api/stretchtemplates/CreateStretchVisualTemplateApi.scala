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

final case class CreateStretchVisualTemplateBody(
  template: StretchVisualTemplate
)

object CreateStretchVisualTemplateBody {
  implicit val encoder: Encoder[CreateStretchVisualTemplateBody] = deriveEncoder
  implicit val decoder: Decoder[CreateStretchVisualTemplateBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, CreateStretchVisualTemplateBody] = jsonOf
}

final case class CreateStretchVisualTemplateAPIMessage(
  userId: String,
  expectedKind: StretchVisualTemplateKind,
  body: CreateStretchVisualTemplateBody
) extends APIWithTokenMessage[StretchVisualTemplate] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, StretchVisualTemplate]] =
    IO.pure {
      AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).flatMap { _ =>
        val template = StretchVisualTemplateValidation.sanitize(body.template.copy(kind = expectedKind))
        StretchVisualTemplateValidation.ensureKind(template, expectedKind).flatMap { validated =>
          StretchVisualTemplateValidation.validate(validated).flatMap { _ =>
            if (StretchVisualTemplateTable.findById(connection, template.id).nonEmpty) {
              Left(UiCustomizationErrors.StretchVisualTemplateAlreadyExists(template.id).toHttpError)
            } else {
              val timestamp = Instant.now().toString
              val row = StretchVisualTemplateTable.insert(
                connection,
                StretchVisualTemplateRowMapper.fromStretchVisualTemplate(template, createdAt = timestamp, updatedAt = timestamp)
              )
              Right(StretchVisualTemplateRowMapper.toStretchVisualTemplate(row))
            }
          }
        }
      }
    }
}
