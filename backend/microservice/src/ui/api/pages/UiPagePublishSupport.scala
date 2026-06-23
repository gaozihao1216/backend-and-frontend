package microservice.ui.api.pages

import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.ui.objects.page.PageConfig
import microservice.ui.objects.UiCustomizationErrors
import microservice.ui.tables.ui_page.{UiPageRowMapper, UiPageTable}
import microservice.ui.tables.ui_page_rollback.{UiPageRollbackRow, UiPageRollbackTable}

/** 页面发布与回滚的共享存储逻辑。
  *
  * 定义：PublishUiPage / RollbackUiPage / GetPlayerUiPage 共用的 UiPageTable + UiPageRollbackTable 操作。
  * 作用：规范化 PageConfig、写入快照、恢复上一版、读取已发布页。
  * 关联：PublishUiPageAPIMessage、RollbackUiPageAPIMessage、GetPlayerUiPageAPIMessage。
  */
object UiPagePublishSupport {
  def requireNormalizePageConfig(pageId: String, page: PageConfig): Step[PageConfig] =
    PlanStep.fromEither(checkNormalizePageConfig(pageId, page))

  def requirePublish(connection: Connection, pageId: String, page: PageConfig): Step[PageConfig] =
    PlanStep.fromEither(checkPublish(connection, pageId, page))

  def requireRollback(connection: Connection, pageId: String): Step[PageConfig] =
    PlanStep.fromEither(checkRollback(connection, pageId))

  def requirePublishedPage(connection: Connection, pageId: String): Step[PageConfig] =
    PlanStep.fromEither(checkPublishedPage(connection, pageId))

  /** 校验并规范化 PageConfig：trim name/path，强制 id 为路径 pageId。 */
  def checkNormalizePageConfig(pageId: String, page: PageConfig): Either[HttpError, PageConfig] =
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

  /** 发布页面：不存在则 insert；存在则先 upsert 回滚快照再 update。 */
  def checkPublish(connection: Connection, pageId: String, page: PageConfig): Either[HttpError, PageConfig] =
    for {
      normalized <- checkNormalizePageConfig(pageId, page)
      // 不存在则 insert；存在则写回滚快照再 update
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

  /** 回滚页面：读取快照写回 UiPageTable 并删除快照。 */
  def checkRollback(connection: Connection, pageId: String): Either[HttpError, PageConfig] =
    for {
      // 读取回滚快照
      rollbackRow <- UiPageRollbackTable
        .findById(connection, pageId)
        .toRight(UiCustomizationErrors.PageRollbackUnavailable(pageId).toHttpError)
      // 读取当前页面行以保留 createdAt
      existing <- UiPageTable
        .findById(connection, pageId)
        .toRight(UiCustomizationErrors.PageNotFound(pageId).toHttpError)
      // 用快照内容 update 当前页
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
      // 回滚成功后删除快照
      _ = UiPageRollbackTable.deleteById(connection, pageId)
    } yield restored

  /** 读取已发布页面配置（玩家侧只读）。 */
  def checkPublishedPage(connection: Connection, pageId: String): Either[HttpError, PageConfig] =
    UiPageTable
      .findById(connection, pageId)
      .map(UiPageRowMapper.toPageConfig)
      .toRight(UiCustomizationErrors.PageNotFound(pageId).toHttpError)
}
