package microservice.ui.support.buttontemplates

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.http.HttpError
import microservice.ui.objects.button_template.ButtonTemplate
import microservice.ui.objects.errors.UiCustomizationErrors
import microservice.ui.tables.button_template.{ButtonTemplateRow, ButtonTemplateRowMapper, ButtonTemplateTable}

/** 按钮模板查重、查存在与写结果校验。 */
private[ui] object ButtonTemplateAccess {
  /** 校验 templateId 在库中尚不存在。 */
  def requireUniqueId(connection: Connection, templateId: String): IO[Either[HttpError, Unit]] =
    IO(ButtonTemplateTable.findById(connection, templateId)).map {
      case Some(_) => Left(UiCustomizationErrors.ButtonTemplateAlreadyExists(templateId).toHttpError)
      case None    => Right(())
    }

  /** 按 templateId 查找 Row（更新/删除前置）。 */
  def requireExisting(connection: Connection, templateId: String): IO[Either[HttpError, ButtonTemplateRow]] =
    IO(ButtonTemplateTable.findById(connection, templateId)).map {
      case None      => Left(UiCustomizationErrors.ButtonTemplateNotFound(templateId).toHttpError)
      case Some(row) => Right(row)
    }

  /** 按 templateId 查找并转为 ButtonTemplate 领域对象。 */
  def requireTemplate(connection: Connection, templateId: String): IO[Either[HttpError, ButtonTemplate]] =
    requireExisting(connection, templateId).map(_.map(ButtonTemplateRowMapper.toButtonTemplate))

  /** 更新模板并返回领域对象。 */
  def requireUpdated(connection: Connection, row: ButtonTemplateRow): IO[Either[HttpError, ButtonTemplate]] =
    IO(ButtonTemplateTable.update(connection, row)).map {
      case None          => Left(UiCustomizationErrors.ButtonTemplateNotFound(row.id).toHttpError)
      case Some(updated) => Right(ButtonTemplateRowMapper.toButtonTemplate(updated))
    }

  /** 删除模板并返回被删领域对象。 */
  def requireDeleted(connection: Connection, templateId: String): IO[Either[HttpError, ButtonTemplate]] =
    IO(ButtonTemplateTable.deleteById(connection, templateId)).map {
      case None      => Left(UiCustomizationErrors.ButtonTemplateNotFound(templateId).toHttpError)
      case Some(row) => Right(ButtonTemplateRowMapper.toButtonTemplate(row))
    }
}
