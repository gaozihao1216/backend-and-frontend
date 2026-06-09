package microservice.ui.api.buttontemplates

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import java.sql.Connection
import java.time.Instant
import microservice.auth.utils.AccessControl
import microservice.infrastructure.api.APIWithTokenMessage
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel
import microservice.ui.objects.{ButtonTemplate, UiCustomizationErrors}
import microservice.ui.tables.button_template.{ButtonTemplateRowMapper, ButtonTemplateTable}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

final case class CreateButtonTemplateBody(
  template: ButtonTemplate
)

object CreateButtonTemplateBody {
  implicit val encoder: Encoder[CreateButtonTemplateBody] = deriveEncoder
  implicit val decoder: Decoder[CreateButtonTemplateBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, CreateButtonTemplateBody] = jsonOf
}

final case class CreateButtonTemplateAPIMessage(
  userId: String,
  body: CreateButtonTemplateBody
) extends APIWithTokenMessage[ButtonTemplate] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, ButtonTemplate]] =
    IO.pure {
      AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).flatMap { _ =>
        val template = ButtonTemplateValidation.sanitize(body.template)
        if (ButtonTemplateTable.findById(connection, template.id).nonEmpty) {
          Left(UiCustomizationErrors.ButtonTemplateAlreadyExists(template.id).toHttpError)
        } else {
          ButtonTemplateValidation.validate(template).map { _ =>
            val timestamp = Instant.now().toString
            val row = ButtonTemplateTable.insert(
              connection,
              ButtonTemplateRowMapper.fromButtonTemplate(template, createdAt = timestamp, updatedAt = timestamp)
            )
            ButtonTemplateRowMapper.toButtonTemplate(row)
          }
        }
      }
    }
}
