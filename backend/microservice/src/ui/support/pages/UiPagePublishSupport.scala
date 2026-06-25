package microservice.ui.support.pages

import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.http.HttpError
import microservice.ui.objects.errors.UiCustomizationErrors
import microservice.ui.objects.page.PageConfig
import microservice.ui.tables.ui_page.{UiPageRowMapper, UiPageTable}
import microservice.ui.tables.ui_page_rollback.{UiPageRollbackRow, UiPageRollbackTable}

/** 页面发布与回滚的共享存储逻辑。 */
private[ui] object UiPagePublishSupport {
  def requireNormalizePageConfig(pageId: String, page: PageConfig): IO[Either[HttpError, PageConfig]] =
    IO.pure(normalizePageConfig(pageId, page))

  private def normalizePageConfig(pageId: String, page: PageConfig): Either[HttpError, PageConfig] =
    if (page.name.trim.isEmpty || page.path.trim.isEmpty) {
      Left(UiCustomizationErrors.InvalidPageConfig("name and path are required").toHttpError)
    } else {
      Right(
        page.copy(
          id = pageId,
          name = page.name.trim,
          path = page.path.trim
        )
      )
    }

  def requirePublish(connection: Connection, pageId: String, page: PageConfig): IO[Either[HttpError, PageConfig]] =
    IO {
      normalizePageConfig(pageId, page).flatMap { normalized =>
        UiPageTable.findById(connection, pageId) match {
          case None =>
            val timestamp = Instant.now().toString
            Right(
              UiPageRowMapper.toPageConfig(
                UiPageTable.insert(
                  connection,
                  UiPageRowMapper.fromPageConfig(normalized, createdAt = timestamp, updatedAt = timestamp)
                )
              )
            )
          case Some(existing) =>
            UiPageRollbackTable.upsert(
              connection,
              UiPageRollbackRow(
                pageId = pageId,
                page = UiPageRowMapper.toPageConfig(existing),
                createdAt = Instant.now().toString
              )
            )
            UiPageTable.update(
              connection,
              UiPageRowMapper.fromPageConfig(
                normalized,
                createdAt = existing.createdAt,
                updatedAt = Instant.now().toString
              )
            ) match {
              case None      => Left(UiCustomizationErrors.PageNotFound(pageId).toHttpError)
              case Some(row) => Right(UiPageRowMapper.toPageConfig(row))
            }
        }
      }
    }

  def requireRollback(connection: Connection, pageId: String): IO[Either[HttpError, PageConfig]] =
    IO {
      for {
        rollbackRow <- UiPageRollbackTable.findById(connection, pageId).toRight(
          UiCustomizationErrors.PageRollbackUnavailable(pageId).toHttpError
        )
        existing <- UiPageTable.findById(connection, pageId).toRight(
          UiCustomizationErrors.PageNotFound(pageId).toHttpError
        )
        restored <- UiPageTable
          .update(
            connection,
            UiPageRowMapper.fromPageConfig(
              rollbackRow.page.copy(id = pageId),
              createdAt = existing.createdAt,
              updatedAt = Instant.now().toString
            )
          )
          .toRight(UiCustomizationErrors.PageNotFound(pageId).toHttpError)
      } yield {
        UiPageRollbackTable.deleteById(connection, pageId)
        UiPageRowMapper.toPageConfig(restored)
      }
    }

  def requirePublishedPage(connection: Connection, pageId: String): IO[Either[HttpError, PageConfig]] =
    IO(UiPageTable.findById(connection, pageId)).map {
      case None      => Left(UiCustomizationErrors.PageNotFound(pageId).toHttpError)
      case Some(row) => Right(UiPageRowMapper.toPageConfig(row))
    }
}
