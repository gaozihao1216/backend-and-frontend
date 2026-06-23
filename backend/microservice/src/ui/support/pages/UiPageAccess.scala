package microservice.ui.support.pages

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.ui.objects.page.PageConfig
import microservice.ui.objects.UiCustomizationErrors
import microservice.ui.tables.ui_page.{UiPageRowMapper, UiPageTable}

/** UI 页面 CRUD 的查存在、字段校验与 upsert/delete 写结果校验。 */
private[ui] object UiPageAccess {
  def requirePage(connection: Connection, pageId: String): Step[PageConfig] =
    EitherT.liftF(IO(UiPageTable.findById(connection, pageId))).flatMap {
      case None      => EitherT.leftT(UiCustomizationErrors.PageNotFound(pageId).toHttpError)
      case Some(row) => EitherT.rightT(UiPageRowMapper.toPageConfig(row))
    }

  def requireCreatePage(connection: Connection, page: PageConfig): Step[Unit] =
    EitherT.liftF(IO(UiPageTable.findById(connection, page.id))).flatMap {
      case Some(_) =>
        EitherT.leftT(UiCustomizationErrors.PageAlreadyExists(page.id).toHttpError)
      case None if page.id.trim.isEmpty || page.name.trim.isEmpty || page.path.trim.isEmpty =>
        EitherT.leftT(UiCustomizationErrors.InvalidPageConfig("id, name and path are required").toHttpError)
      case None =>
        EitherT.rightT(())
    }

  def requireUpdateFields(page: PageConfig): Step[Unit] =
    if (page.name.trim.isEmpty || page.path.trim.isEmpty) {
      PlanStep.fail(UiCustomizationErrors.InvalidPageConfig("name and path are required").toHttpError)
    } else {
      PlanStep.succeed(())
    }

  def requireUpsertPage(connection: Connection, pageId: String, page: PageConfig): Step[PageConfig] = {
    val updatedConfig = page.copy(
      id = pageId,
      name = page.name.trim,
      path = page.path.trim
    )

    EitherT.liftF(IO(UiPageTable.findById(connection, pageId))).flatMap {
      case None =>
        EitherT.rightT {
          val timestamp = Instant.now().toString
          val inserted = UiPageTable.insert(
            connection,
            UiPageRowMapper.fromPageConfig(updatedConfig, createdAt = timestamp, updatedAt = timestamp)
          )
          UiPageRowMapper.toPageConfig(inserted)
        }
      case Some(existing) =>
        EitherT.liftF(
          IO(
            UiPageTable.update(
              connection,
              UiPageRowMapper.fromPageConfig(
                updatedConfig,
                createdAt = existing.createdAt,
                updatedAt = Instant.now().toString
              )
            )
          )
        ).flatMap {
          case None =>
            EitherT.leftT(UiCustomizationErrors.PageNotFound(pageId).toHttpError)
          case Some(row) =>
            EitherT.rightT(UiPageRowMapper.toPageConfig(row))
        }
    }
  }

  def requireDeletePage(connection: Connection, pageId: String): Step[PageConfig] =
    EitherT.liftF(IO(UiPageTable.deleteById(connection, pageId))).flatMap {
      case None      => EitherT.leftT(UiCustomizationErrors.PageNotFound(pageId).toHttpError)
      case Some(row) => EitherT.rightT(UiPageRowMapper.toPageConfig(row))
    }
}
