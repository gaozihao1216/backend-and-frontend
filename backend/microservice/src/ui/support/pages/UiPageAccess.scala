package microservice.ui.support.pages

import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.http.HttpError
import microservice.ui.objects.errors.UiCustomizationErrors
import microservice.ui.objects.page.PageConfig
import microservice.ui.tables.ui_page.{UiPageRowMapper, UiPageTable}

/** UI 页面 CRUD 的查存在、字段校验与 upsert/delete 写结果校验。 */
private[ui] object UiPageAccess {
  def requirePage(connection: Connection, pageId: String): IO[Either[HttpError, PageConfig]] =
    IO(UiPageTable.findById(connection, pageId)).map {
      case None      => Left(UiCustomizationErrors.PageNotFound(pageId).toHttpError)
      case Some(row) => Right(UiPageRowMapper.toPageConfig(row))
    }

  def requireCreatePage(connection: Connection, page: PageConfig): IO[Either[HttpError, Unit]] =
    IO(UiPageTable.findById(connection, page.id)).map {
      case Some(_) =>
        Left(UiCustomizationErrors.PageAlreadyExists(page.id).toHttpError)
      case None if page.id.trim.isEmpty || page.name.trim.isEmpty || page.path.trim.isEmpty =>
        Left(UiCustomizationErrors.InvalidPageConfig("id, name and path are required").toHttpError)
      case None =>
        Right(())
    }

  def requireUpdateFields(page: PageConfig): IO[Either[HttpError, Unit]] =
    IO.pure {
      if (page.name.trim.isEmpty || page.path.trim.isEmpty) {
        Left(UiCustomizationErrors.InvalidPageConfig("name and path are required").toHttpError)
      } else {
        Right(())
      }
    }

  def requireUpsertPage(connection: Connection, pageId: String, page: PageConfig): IO[Either[HttpError, PageConfig]] =
    IO {
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
          UiPageTable.update(
            connection,
            UiPageRowMapper.fromPageConfig(
              updatedConfig,
              createdAt = existing.createdAt,
              updatedAt = Instant.now().toString
            )
          ) match {
            case None      => Left(UiCustomizationErrors.PageNotFound(pageId).toHttpError)
            case Some(row) => Right(UiPageRowMapper.toPageConfig(row))
          }
      }
    }

  def requireDeletePage(connection: Connection, pageId: String): IO[Either[HttpError, PageConfig]] =
    IO(UiPageTable.deleteById(connection, pageId)).map {
      case None      => Left(UiCustomizationErrors.PageNotFound(pageId).toHttpError)
      case Some(row) => Right(UiPageRowMapper.toPageConfig(row))
    }
}
