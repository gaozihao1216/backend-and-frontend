package microservice.ui.api.stretchtemplates

import cats.effect.IO
import java.sql.Connection
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.APIWithTokenMessage
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel
import microservice.ui.objects.{StretchVisualTemplate, StretchVisualTemplateKind, UiCustomizationErrors}
import microservice.ui.tables.stretch_visual_template.{StretchVisualTemplateRowMapper, StretchVisualTemplateTable}

final case class DeleteStretchVisualTemplateAPIMessage(
  userId: String,
  templateId: String,
  expectedKind: StretchVisualTemplateKind
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
          case Some(_) =>
            StretchVisualTemplateTable
              .deleteById(connection, templateId)
              .map(StretchVisualTemplateRowMapper.toStretchVisualTemplate)
              .toRight(UiCustomizationErrors.StretchVisualTemplateNotFound(templateId).toHttpError)
        }
      }
    }
}
