package microservice.ui.api.stretchtemplates.support

import java.sql.Connection
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.ui.objects.stretch_template.{StretchVisualTemplate, StretchVisualTemplateKind}
import microservice.ui.objects.UiCustomizationErrors
import microservice.ui.tables.stretch_visual_template.{
  StretchVisualTemplateRow,
  StretchVisualTemplateRowMapper,
  StretchVisualTemplateTable
}

/** 拉伸视觉模板查重、查存在与写结果校验。 */
private[api] object StretchVisualTemplateAccess {
  def requireUniqueId(connection: Connection, templateId: String): Step[Unit] =
    PlanStep.fromEither(checkUniqueId(connection, templateId))

  def requireExistingForKind(
    connection: Connection,
    templateId: String,
    expectedKind: StretchVisualTemplateKind
  ): Step[StretchVisualTemplateRow] =
    PlanStep.fromEither(checkExistingForKind(connection, templateId, expectedKind))

  def requireUpdated(connection: Connection, row: StretchVisualTemplateRow): Step[StretchVisualTemplate] =
    PlanStep.fromEither(checkUpdated(connection, row))

  def requireDeleted(
    connection: Connection,
    templateId: String,
    expectedKind: StretchVisualTemplateKind
  ): Step[StretchVisualTemplate] =
    PlanStep.fromEither(checkDeleted(connection, templateId, expectedKind))

  def checkUniqueId(connection: Connection, templateId: String): Either[HttpError, Unit] =
    if (StretchVisualTemplateTable.findById(connection, templateId).nonEmpty) {
      Left(UiCustomizationErrors.StretchVisualTemplateAlreadyExists(templateId).toHttpError)
    } else {
      Right(())
    }

  def checkExistingForKind(
    connection: Connection,
    templateId: String,
    expectedKind: StretchVisualTemplateKind
  ): Either[HttpError, StretchVisualTemplateRow] =
    StretchVisualTemplateTable.findById(connection, templateId) match {
      case None =>
        Left(UiCustomizationErrors.StretchVisualTemplateNotFound(templateId).toHttpError)
      case Some(row) if row.kind != expectedKind =>
        Left(UiCustomizationErrors.StretchVisualTemplateKindMismatch(expectedKind.value, row.kind.value).toHttpError)
      case Some(row) =>
        Right(row)
    }

  def checkUpdated(connection: Connection, row: StretchVisualTemplateRow): Either[HttpError, StretchVisualTemplate] =
    StretchVisualTemplateTable
      .update(connection, row)
      .map(StretchVisualTemplateRowMapper.toStretchVisualTemplate)
      .toRight(UiCustomizationErrors.StretchVisualTemplateNotFound(row.id).toHttpError)

  def checkDeleted(
    connection: Connection,
    templateId: String,
    expectedKind: StretchVisualTemplateKind
  ): Either[HttpError, StretchVisualTemplate] =
    checkExistingForKind(connection, templateId, expectedKind).flatMap { _ =>
      StretchVisualTemplateTable
        .deleteById(connection, templateId)
        .map(StretchVisualTemplateRowMapper.toStretchVisualTemplate)
        .toRight(UiCustomizationErrors.StretchVisualTemplateNotFound(templateId).toHttpError)
    }
}
