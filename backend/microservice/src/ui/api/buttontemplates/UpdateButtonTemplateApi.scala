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

final case class UpdateButtonTemplateBody(
  template: ButtonTemplate
)

object UpdateButtonTemplateBody {
  implicit val encoder: Encoder[UpdateButtonTemplateBody] = deriveEncoder
  implicit val decoder: Decoder[UpdateButtonTemplateBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, UpdateButtonTemplateBody] = jsonOf
}

final case class UpdateButtonTemplateAPIMessage(
  userId: String,
  templateId: String,
  body: UpdateButtonTemplateBody
) extends APIWithTokenMessage[ButtonTemplate] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, ButtonTemplate]] =
    IO.pure {
      AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).flatMap { _ =>
        ButtonTemplateTable.findById(connection, templateId) match {
          case None =>
            Left(UiCustomizationErrors.ButtonTemplateNotFound(templateId).toHttpError)
          case Some(existing) =>
            val template = ButtonTemplateValidation.sanitize(body.template.copy(id = templateId))
            ButtonTemplateValidation.validate(template).flatMap { _ =>
              ButtonTemplateTable
                .update(
                  connection,
                  ButtonTemplateRowMapper.fromButtonTemplate(
                    template,
                    createdAt = existing.createdAt,
                    updatedAt = Instant.now().toString
                  )
                )
                .map(row => Right(ButtonTemplateRowMapper.toButtonTemplate(row)))
                .getOrElse(Left(UiCustomizationErrors.ButtonTemplateNotFound(templateId).toHttpError))
            }
        }
      }
    }
}
