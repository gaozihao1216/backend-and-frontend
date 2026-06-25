package microservice.ui.support.stretchtemplates

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.ui.objects.stretch_template.{StretchVisualTemplate, StretchVisualTemplateKind}
import microservice.ui.objects.errors.UiCustomizationErrors
import microservice.ui.tables.stretch_visual_template.{
  StretchVisualTemplateRow,
  StretchVisualTemplateRowMapper,
  StretchVisualTemplateTable
}

/** 拉伸视觉模板查重、查存在与写结果校验。 */
private[ui] object StretchVisualTemplateAccess {
  def requireUniqueId(connection: Connection, templateId: String): Step[Unit] =
    EitherT.liftF(IO(StretchVisualTemplateTable.findById(connection, templateId))).flatMap {
      case Some(_) => EitherT.leftT(UiCustomizationErrors.StretchVisualTemplateAlreadyExists(templateId).toHttpError)
      case None    => EitherT.rightT(())
    }

  def requireExistingForKind(
    connection: Connection,
    templateId: String,
    expectedKind: StretchVisualTemplateKind
  ): Step[StretchVisualTemplateRow] =
    EitherT.liftF(IO(StretchVisualTemplateTable.findById(connection, templateId))).flatMap {
      case None =>
        EitherT.leftT(UiCustomizationErrors.StretchVisualTemplateNotFound(templateId).toHttpError)
      case Some(row) if row.kind != expectedKind =>
        EitherT.leftT(UiCustomizationErrors.StretchVisualTemplateKindMismatch(expectedKind.value, row.kind.value).toHttpError)
      case Some(row) =>
        EitherT.rightT(row)
    }

  def requireUpdated(connection: Connection, row: StretchVisualTemplateRow): Step[StretchVisualTemplate] =
    EitherT.liftF(IO(StretchVisualTemplateTable.update(connection, row))).flatMap {
      case None      => EitherT.leftT(UiCustomizationErrors.StretchVisualTemplateNotFound(row.id).toHttpError)
      case Some(updated) => EitherT.rightT(StretchVisualTemplateRowMapper.toStretchVisualTemplate(updated))
    }

  def requireDeleted(
    connection: Connection,
    templateId: String,
    expectedKind: StretchVisualTemplateKind
  ): Step[StretchVisualTemplate] =
    for {
      _ <- requireExistingForKind(connection, templateId, expectedKind)
      deleted <- StretchVisualTemplateTable.deleteById(connection, templateId) match {
        case None      => PlanStep.fail(UiCustomizationErrors.StretchVisualTemplateNotFound(templateId).toHttpError)
        case Some(row) => PlanStep.succeed(StretchVisualTemplateRowMapper.toStretchVisualTemplate(row))
      }
    } yield deleted
}
