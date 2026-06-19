package microservice.ui.api.pages

import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.http.HttpError
import microservice.ui.objects.{PageConfig, UiCustomizationErrors}
import microservice.ui.tables.ui_page.{UiPageRowMapper, UiPageTable}
import microservice.ui.tables.ui_page_rollback.{UiPageRollbackRow, UiPageRollbackTable}

/** 发布与回滚的共享存储逻辑。 */
object UiPagePublishSupport {
  def normalizePageConfig(pageId: String, page: PageConfig): Either[HttpError, PageConfig] =
    if (page.name.trim.isEmpty || page.path.trim.isEmpty) {
      Left(UiCustomizationErrors.InvalidPageConfig("name and path are required").toHttpError)
    } else {
      Right(
        page.copy(
          id = pageId,
          name = page.name.trim,
          path = page.path.trim,
        )
      )
    }

  def publish(connection: Connection, pageId: String, page: PageConfig): Either[HttpError, PageConfig] =
    for {
      normalized <- normalizePageConfig(pageId, page)
      published <- UiPageTable.findById(connection, pageId) match {
        case None =>
          val timestamp = Instant.now().toString
          Right(
            UiPageRowMapper.toPageConfig(
              UiPageTable.insert(
                connection,
                UiPageRowMapper.fromPageConfig(normalized, createdAt = timestamp, updatedAt = timestamp),
              )
            )
          )
        case Some(existing) =>
          UiPageRollbackTable.upsert(
            connection,
            UiPageRollbackRow(
              pageId = pageId,
              page = UiPageRowMapper.toPageConfig(existing),
              createdAt = Instant.now().toString,
            ),
          )
          UiPageTable
            .update(
              connection,
              UiPageRowMapper.fromPageConfig(
                normalized,
                createdAt = existing.createdAt,
                updatedAt = Instant.now().toString,
              ),
            )
            .map(UiPageRowMapper.toPageConfig)
            .toRight(UiCustomizationErrors.PageNotFound(pageId).toHttpError)
      }
    } yield published

  def rollback(connection: Connection, pageId: String): Either[HttpError, PageConfig] =
    for {
      rollbackRow <- UiPageRollbackTable
        .findById(connection, pageId)
        .toRight(UiCustomizationErrors.PageRollbackUnavailable(pageId).toHttpError)
      existing <- UiPageTable
        .findById(connection, pageId)
        .toRight(UiCustomizationErrors.PageNotFound(pageId).toHttpError)
      restored <- UiPageTable
        .update(
          connection,
          UiPageRowMapper.fromPageConfig(
            rollbackRow.page.copy(id = pageId),
            createdAt = existing.createdAt,
            updatedAt = Instant.now().toString,
          ),
        )
        .map(UiPageRowMapper.toPageConfig)
        .toRight(UiCustomizationErrors.PageNotFound(pageId).toHttpError)
      _ = UiPageRollbackTable.deleteById(connection, pageId)
    } yield restored

  def getPublishedPage(connection: Connection, pageId: String): Either[HttpError, PageConfig] =
    UiPageTable
      .findById(connection, pageId)
      .map(UiPageRowMapper.toPageConfig)
      .toRight(UiCustomizationErrors.PageNotFound(pageId).toHttpError)
}
