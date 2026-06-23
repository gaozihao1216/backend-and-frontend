package microservice.ui.api.buttontemplates.support

import java.sql.Connection
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.ui.objects.button_template.ButtonTemplate
import microservice.ui.objects.UiCustomizationErrors
import microservice.ui.tables.button_template.{ButtonTemplateRow, ButtonTemplateRowMapper, ButtonTemplateTable}

/** 按钮模板查重、查存在与写结果校验。 */
private[api] object ButtonTemplateAccess {
  def requireUniqueId(connection: Connection, templateId: String): Step[Unit] =
    PlanStep.fromEither(checkUniqueId(connection, templateId))

  def requireExisting(connection: Connection, templateId: String): Step[ButtonTemplateRow] =
    PlanStep.fromEither(checkExisting(connection, templateId))

  def requireTemplate(connection: Connection, templateId: String): Step[ButtonTemplate] =
    PlanStep.fromEither(checkTemplate(connection, templateId))

  def requireUpdated(connection: Connection, row: ButtonTemplateRow): Step[ButtonTemplate] =
    PlanStep.fromEither(checkUpdated(connection, row))

  def requireDeleted(connection: Connection, templateId: String): Step[ButtonTemplate] =
    PlanStep.fromEither(checkDeleted(connection, templateId))

  def checkUniqueId(connection: Connection, templateId: String): Either[HttpError, Unit] =
    if (ButtonTemplateTable.findById(connection, templateId).nonEmpty) {
      Left(UiCustomizationErrors.ButtonTemplateAlreadyExists(templateId).toHttpError)
    } else {
      Right(())
    }

  def checkExisting(connection: Connection, templateId: String): Either[HttpError, ButtonTemplateRow] =
    ButtonTemplateTable.findById(connection, templateId) match {
      case None        => Left(UiCustomizationErrors.ButtonTemplateNotFound(templateId).toHttpError)
      case Some(row)   => Right(row)
    }

  def checkTemplate(connection: Connection, templateId: String): Either[HttpError, ButtonTemplate] =
    checkExisting(connection, templateId).map(ButtonTemplateRowMapper.toButtonTemplate)

  def checkUpdated(connection: Connection, row: ButtonTemplateRow): Either[HttpError, ButtonTemplate] =
    ButtonTemplateTable
      .update(connection, row)
      .map(ButtonTemplateRowMapper.toButtonTemplate)
      .toRight(UiCustomizationErrors.ButtonTemplateNotFound(row.id).toHttpError)

  def checkDeleted(connection: Connection, templateId: String): Either[HttpError, ButtonTemplate] =
    ButtonTemplateTable
      .deleteById(connection, templateId)
      .map(ButtonTemplateRowMapper.toButtonTemplate)
      .toRight(UiCustomizationErrors.ButtonTemplateNotFound(templateId).toHttpError)
}
