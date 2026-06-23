package microservice.ui.support.buttontemplates

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.ui.objects.button_template.ButtonTemplate
import microservice.ui.objects.UiCustomizationErrors
import microservice.ui.tables.button_template.{ButtonTemplateRow, ButtonTemplateRowMapper, ButtonTemplateTable}

/** 按钮模板查重、查存在与写结果校验。 */
private[ui] object ButtonTemplateAccess {
  /** 校验 templateId 在库中尚不存在。 */
  def requireUniqueId(connection: Connection, templateId: String): Step[Unit] =
    EitherT.liftF(IO(ButtonTemplateTable.findById(connection, templateId))).flatMap {
      case Some(_) => EitherT.leftT(UiCustomizationErrors.ButtonTemplateAlreadyExists(templateId).toHttpError)
      case None    => EitherT.rightT(())
    }

  /** 按 templateId 查找 Row（更新/删除前置）。 */
  def requireExisting(connection: Connection, templateId: String): Step[ButtonTemplateRow] =
    EitherT.liftF(IO(ButtonTemplateTable.findById(connection, templateId))).flatMap {
      case None      => EitherT.leftT(UiCustomizationErrors.ButtonTemplateNotFound(templateId).toHttpError)
      case Some(row) => EitherT.rightT(row)
    }

  /** 按 templateId 查找并转为 ButtonTemplate 领域对象。 */
  def requireTemplate(connection: Connection, templateId: String): Step[ButtonTemplate] =
    requireExisting(connection, templateId).map(ButtonTemplateRowMapper.toButtonTemplate)

  /** 更新模板并返回领域对象。 */
  def requireUpdated(connection: Connection, row: ButtonTemplateRow): Step[ButtonTemplate] =
    EitherT.liftF(IO(ButtonTemplateTable.update(connection, row))).flatMap {
      case None      => EitherT.leftT(UiCustomizationErrors.ButtonTemplateNotFound(row.id).toHttpError)
      case Some(updated) => EitherT.rightT(ButtonTemplateRowMapper.toButtonTemplate(updated))
    }

  /** 删除模板并返回被删领域对象。 */
  def requireDeleted(connection: Connection, templateId: String): Step[ButtonTemplate] =
    EitherT.liftF(IO(ButtonTemplateTable.deleteById(connection, templateId))).flatMap {
      case None      => EitherT.leftT(UiCustomizationErrors.ButtonTemplateNotFound(templateId).toHttpError)
      case Some(row) => EitherT.rightT(ButtonTemplateRowMapper.toButtonTemplate(row))
    }
}
