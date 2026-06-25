package microservice.ui.support.stretchtemplates

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.http.HttpError
import microservice.ui.objects.errors.UiCustomizationErrors
import microservice.ui.objects.stretch_template.{StretchVisualTemplate, StretchVisualTemplateKind}
import microservice.ui.tables.stretch_visual_template.{
  StretchVisualTemplateRow,
  StretchVisualTemplateRowMapper,
  StretchVisualTemplateTable
}

/** 拉伸视觉模板查重、查存在与写结果校验。 */
private[ui] object StretchVisualTemplateAccess {
  def requireUniqueId(connection: Connection, templateId: String): IO[Either[HttpError, Unit]] =
    IO(StretchVisualTemplateTable.findById(connection, templateId)).map {
      case Some(_) => Left(UiCustomizationErrors.StretchVisualTemplateAlreadyExists(templateId).toHttpError)
      case None    => Right(())
    }

  def requireExistingForKind(
    connection: Connection,
    templateId: String,
    expectedKind: StretchVisualTemplateKind
  ): IO[Either[HttpError, StretchVisualTemplateRow]] =
    IO(StretchVisualTemplateTable.findById(connection, templateId)).map {
      case None =>
        Left(UiCustomizationErrors.StretchVisualTemplateNotFound(templateId).toHttpError)
      case Some(row) if row.kind != expectedKind =>
        Left(UiCustomizationErrors.StretchVisualTemplateKindMismatch(expectedKind.value, row.kind.value).toHttpError)
      case Some(row) =>
        Right(row)
    }

  def requireUpdated(
    connection: Connection,
    row: StretchVisualTemplateRow
  ): IO[Either[HttpError, StretchVisualTemplate]] =
    IO(StretchVisualTemplateTable.update(connection, row)).map {
      case None          => Left(UiCustomizationErrors.StretchVisualTemplateNotFound(row.id).toHttpError)
      case Some(updated) => Right(StretchVisualTemplateRowMapper.toStretchVisualTemplate(updated))
    }

  def requireDeleted(
    connection: Connection,
    templateId: String,
    expectedKind: StretchVisualTemplateKind
  ): IO[Either[HttpError, StretchVisualTemplate]] =
    requireExistingForKind(connection, templateId, expectedKind).flatMap {
      case Left(error) =>
        IO.pure(Left(error))
      case Right(_) =>
        IO(StretchVisualTemplateTable.deleteById(connection, templateId)).map {
          case None      => Left(UiCustomizationErrors.StretchVisualTemplateNotFound(templateId).toHttpError)
          case Some(row) => Right(StretchVisualTemplateRowMapper.toStretchVisualTemplate(row))
        }
    }
}
