package microservice.ui.tables.ui_page_rollback

import java.sql.Connection
import microservice.infrastructure.database.{InMemoryStore, TableConnection}
import microservice.ui.tables.ui_page_rollback.jdbc.UiPageRollbackTableJdbc

/** UI 页面回滚快照表访问门面：每页最多保留一版上一发布配置。
  *
  * 定义：PublishUiPage 写入快照，RollbackUiPage 读取并恢复后删除。
  * 作用：总监误发布时可一键回滚，无需手动重建 PageConfig。
  * 关联：UiPagePublishSupport.publish/rollback；前端 DirectorWorkbench 发布/回滚按钮。
  */
object UiPageRollbackTable {
  /** 启动时建表；仅 JDBC 模式执行 DDL。 */
  def initialize(connection: Connection): Unit = {
    if (!TableConnection.isInMemory(connection)) UiPageRollbackTableJdbc.initialize(connection)
  }

  /** 按 pageId 查找回滚快照。 */
  def findById(connection: Connection, pageId: String): Option[UiPageRollbackRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.uiPageRollbacks.find(_.pageId == pageId)
    } else {
      UiPageRollbackTableJdbc.findById(connection, pageId)
    }

  /** 插入或覆盖该页的回滚快照（每页仅保留最新一版）。 */
  def upsert(connection: Connection, row: UiPageRollbackRow): UiPageRollbackRow =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.uiPageRollbacks.indexWhere(_.pageId == row.pageId) match {
        case -1 =>
          InMemoryStore.uiPageRollbacks = InMemoryStore.uiPageRollbacks :+ row
        case index =>
          InMemoryStore.uiPageRollbacks = InMemoryStore.uiPageRollbacks.updated(index, row)
      }
      row
    } else {
      UiPageRollbackTableJdbc.upsert(connection, row)
    }

  /** 按 pageId 删除回滚快照并返回被删行。 */
  def deleteById(connection: Connection, pageId: String): Option[UiPageRollbackRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.uiPageRollbacks.indexWhere(_.pageId == pageId) match {
        case -1 => None
        case index =>
          val deleted = InMemoryStore.uiPageRollbacks(index)
          InMemoryStore.uiPageRollbacks = InMemoryStore.uiPageRollbacks.patch(index, Nil, 1)
          Some(deleted)
      }
    } else {
      UiPageRollbackTableJdbc.deleteById(connection, pageId)
    }
}
