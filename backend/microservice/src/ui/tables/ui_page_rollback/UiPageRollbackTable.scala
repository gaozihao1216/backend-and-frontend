package microservice.ui.tables.ui_page_rollback

import microservice.ui.tables.ui_page_rollback.inmemory.UiPageRollbackTableInMemory
import microservice.ui.tables.ui_page_rollback.jdbc.{
  UiPageRollbackTableJdbcRead,
  UiPageRollbackTableJdbcSchema,
  UiPageRollbackTableJdbcWrite
}

import java.sql.Connection

/** UI 页面回滚快照表访问门面：每页最多保留一版上一发布配置。
  *
  * 定义：PublishUiPage 写入快照，RollbackUiPage 读取并恢复后删除。
  * 作用：总监误发布时可一键回滚，无需手动重建 PageConfig。
  * 关联：UiPagePublishSupport.publish/rollback；前端 DirectorWorkbench 发布/回滚按钮。
  */
object UiPageRollbackTable {
  /** 判断当前是否为 InMemory 模式（connection == null）。 */
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  /** 启动时建表；仅 JDBC 模式执行 DDL。 */
  def initialize(connection: Connection): Unit = {
    if (!isInMemory(connection)) UiPageRollbackTableJdbcSchema.initialize(connection)
  }

  /** 按 pageId 查找回滚快照。 */
  def findById(connection: Connection, pageId: String): Option[UiPageRollbackRow] =
    if (isInMemory(connection)) UiPageRollbackTableInMemory.findById(pageId)
    else UiPageRollbackTableJdbcRead.findById(connection, pageId)

  /** 插入或覆盖该页的回滚快照（每页仅保留最新一版）。 */
  def upsert(connection: Connection, row: UiPageRollbackRow): UiPageRollbackRow =
    if (isInMemory(connection)) UiPageRollbackTableInMemory.upsert(row)
    else UiPageRollbackTableJdbcWrite.upsert(connection, row)

  /** 按 pageId 删除回滚快照并返回被删行。 */
  def deleteById(connection: Connection, pageId: String): Option[UiPageRollbackRow] =
    if (isInMemory(connection)) UiPageRollbackTableInMemory.deleteById(pageId)
    else UiPageRollbackTableJdbcWrite.deleteById(connection, pageId)
}
