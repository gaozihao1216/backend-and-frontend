package microservice.ui.support.pages

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.ui.objects.page.PageConfig
import microservice.ui.objects.UiCustomizationErrors
import microservice.ui.tables.ui_page.{UiPageRowMapper, UiPageTable}
import microservice.ui.tables.ui_page_rollback.{UiPageRollbackRow, UiPageRollbackTable}

/** 页面发布与回滚的共享存储逻辑。 */
object UiPagePublishSupport {
  def requireNormalizePageConfig(pageId: String, page: PageConfig): Step[PageConfig] =
    if (page.name.trim.isEmpty || page.path.trim.isEmpty) {
      PlanStep.fail(UiCustomizationErrors.InvalidPageConfig("name and path are required").toHttpError)
    } else {
      PlanStep.succeed(
        page.copy(
          id = pageId,
          name = page.name.trim,
          path = page.path.trim
        )
      )
    }

  def requirePublish(connection: Connection, pageId: String, page: PageConfig): Step[PageConfig] =
    for {
      normalized <- requireNormalizePageConfig(pageId, page)
      published <- UiPageTable.findById(connection, pageId) match {
        case None =>
          PlanStep.succeed {
            val timestamp = Instant.now().toString
            UiPageRowMapper.toPageConfig(
              UiPageTable.insert(
                connection,
                UiPageRowMapper.fromPageConfig(normalized, createdAt = timestamp, updatedAt = timestamp)
              )
            )
          }
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
            case None =>
              PlanStep.fail(UiCustomizationErrors.PageNotFound(pageId).toHttpError)
            case Some(row) =>
              PlanStep.succeed(UiPageRowMapper.toPageConfig(row))
          }
      }
    } yield published

  def requireRollback(connection: Connection, pageId: String): Step[PageConfig] =
    for {
      rollbackRow <- UiPageRollbackTable.findById(connection, pageId) match {
        case None      => PlanStep.fail(UiCustomizationErrors.PageRollbackUnavailable(pageId).toHttpError)
        case Some(row) => PlanStep.succeed(row)
      }
      existing <- UiPageTable.findById(connection, pageId) match {
        case None      => PlanStep.fail(UiCustomizationErrors.PageNotFound(pageId).toHttpError)
        case Some(row) => PlanStep.succeed(row)
      }
      restored <- UiPageTable.update(
        connection,
        UiPageRowMapper.fromPageConfig(
          rollbackRow.page.copy(id = pageId),
          createdAt = existing.createdAt,
          updatedAt = Instant.now().toString
        )
      ) match {
        case None      => PlanStep.fail(UiCustomizationErrors.PageNotFound(pageId).toHttpError)
        case Some(row) => PlanStep.succeed(UiPageRowMapper.toPageConfig(row))
      }
      _ = UiPageRollbackTable.deleteById(connection, pageId)
    } yield restored

  def requirePublishedPage(connection: Connection, pageId: String): Step[PageConfig] =
    UiPageTable.findById(connection, pageId) match {
      case None      => PlanStep.fail(UiCustomizationErrors.PageNotFound(pageId).toHttpError)
      case Some(row) => PlanStep.succeed(UiPageRowMapper.toPageConfig(row))
    }
}
