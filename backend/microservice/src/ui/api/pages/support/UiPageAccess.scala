package microservice.ui.api.pages.support

import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.ui.objects.page.PageConfig
import microservice.ui.objects.UiCustomizationErrors
import microservice.ui.tables.ui_page.{UiPageRowMapper, UiPageTable}

/** UI 页面 CRUD 的查存在、字段校验与 upsert/delete 写结果校验。 */
private[pages] object UiPageAccess {
  def requirePage(connection: Connection, pageId: String): Step[PageConfig] =
    PlanStep.fromEither(checkPage(connection, pageId))

  def requireCreatePage(connection: Connection, page: PageConfig): Step[Unit] =
    PlanStep.fromEither(checkCreatePage(connection, page))

  def requireUpdateFields(page: PageConfig): Step[Unit] =
    PlanStep.fromEither(checkUpdateFields(page))

  def requireUpsertPage(connection: Connection, pageId: String, page: PageConfig): Step[PageConfig] =
    PlanStep.fromEither(checkUpsertPage(connection, pageId, page))

  def requireDeletePage(connection: Connection, pageId: String): Step[PageConfig] =
    PlanStep.fromEither(checkDeletePage(connection, pageId))

  def checkPage(connection: Connection, pageId: String): Either[HttpError, PageConfig] =
    UiPageTable
      .findById(connection, pageId)
      .map(UiPageRowMapper.toPageConfig)
      .toRight(UiCustomizationErrors.PageNotFound(pageId).toHttpError)

  def checkCreatePage(connection: Connection, page: PageConfig): Either[HttpError, Unit] =
    if (UiPageTable.findById(connection, page.id).nonEmpty) {
      Left(UiCustomizationErrors.PageAlreadyExists(page.id).toHttpError)
    } else if (page.id.trim.isEmpty || page.name.trim.isEmpty || page.path.trim.isEmpty) {
      Left(UiCustomizationErrors.InvalidPageConfig("id, name and path are required").toHttpError)
    } else {
      Right(())
    }

  def checkUpdateFields(page: PageConfig): Either[HttpError, Unit] =
    if (page.name.trim.isEmpty || page.path.trim.isEmpty) {
      Left(UiCustomizationErrors.InvalidPageConfig("name and path are required").toHttpError)
    } else {
      Right(())
    }

  def checkUpsertPage(connection: Connection, pageId: String, page: PageConfig): Either[HttpError, PageConfig] = {
    val updatedConfig = page.copy(
      id = pageId,
      name = page.name.trim,
      path = page.path.trim
    )

    UiPageTable.findById(connection, pageId) match {
      case None =>
        val timestamp = Instant.now().toString
        val inserted = UiPageTable.insert(
          connection,
          UiPageRowMapper.fromPageConfig(updatedConfig, createdAt = timestamp, updatedAt = timestamp)
        )
        Right(UiPageRowMapper.toPageConfig(inserted))
      case Some(existing) =>
        UiPageTable
          .update(
            connection,
            UiPageRowMapper.fromPageConfig(
              updatedConfig,
              createdAt = existing.createdAt,
              updatedAt = Instant.now().toString
            )
          )
          .map(UiPageRowMapper.toPageConfig)
          .toRight(UiCustomizationErrors.PageNotFound(pageId).toHttpError)
    }
  }

  def checkDeletePage(connection: Connection, pageId: String): Either[HttpError, PageConfig] =
    UiPageTable
      .deleteById(connection, pageId)
      .map(UiPageRowMapper.toPageConfig)
      .toRight(UiCustomizationErrors.PageNotFound(pageId).toHttpError)
}
