package microservice.ui.api.buttontemplates

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import java.sql.Connection
import java.time.Instant
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel
import microservice.ui.objects.{ButtonTemplate, UiCustomizationErrors}
import microservice.ui.tables.button_template.{ButtonTemplateRowMapper, ButtonTemplateTable}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** PUT /admin/director/ui/button-templates/:templateId 的请求体。 */
final case class UpdateButtonTemplateBody(
  template: ButtonTemplate
)

object UpdateButtonTemplateBody {
  implicit val encoder: Encoder[UpdateButtonTemplateBody] = deriveEncoder
  implicit val decoder: Decoder[UpdateButtonTemplateBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, UpdateButtonTemplateBody] = jsonOf
}

/** PUT /admin/director/ui/button-templates/:templateId 的 APIMessage。 */
final case class UpdateButtonTemplateAPIMessage(
  userId: String,
  templateId: String,
  body: UpdateButtonTemplateBody
) extends APIWithTokenMessage[ButtonTemplate] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, ButtonTemplate]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ()))
        existing <- PlanSteps.require(
          ButtonTemplateTable.findById(connection, templateId) match {
            case None =>
              Left(UiCustomizationErrors.ButtonTemplateNotFound(templateId).toHttpError)
            case Some(row) =>
              Right(row)
          }
        )
        template <- PlanSteps.read(ButtonTemplateValidation.sanitize(body.template.copy(id = templateId)))
        _ <- PlanSteps.require(ButtonTemplateValidation.validate(template).map(_ => ()))
        result <- PlanSteps.require(
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
        )
      } yield result
    }
}
