package microservice.ui.tables.ui_page_rollback.inmemory

import microservice.infrastructure.database.InMemoryStore
import microservice.ui.tables.ui_page_rollback.UiPageRollbackRow

/** InMemoryStore 上的 UI 页面回滚快照 CRUD；演示模式与单元测试使用。
  *
  * 定义：以 pageId 为主键，每页最多一条快照记录。
  * 关联：UiPageRollbackTable 在 connection == null 时委托到此实现。
  */
private[tables] object UiPageRollbackTableInMemory {
  /** 按 pageId 查找回滚快照。 */
  def findById(pageId: String): Option[UiPageRollbackRow] =
    InMemoryStore.uiPageRollbacks.find(_.pageId == pageId)

  /** 插入或覆盖该页的回滚快照。 */
  def upsert(row: UiPageRollbackRow): UiPageRollbackRow = {
    InMemoryStore.uiPageRollbacks.indexWhere(_.pageId == row.pageId) match {
      case -1 =>
        InMemoryStore.uiPageRollbacks = InMemoryStore.uiPageRollbacks :+ row
      case index =>
        InMemoryStore.uiPageRollbacks = InMemoryStore.uiPageRollbacks.updated(index, row)
    }
    row
  }

  /** 按 pageId 删除回滚快照并返回被删行。 */
  def deleteById(pageId: String): Option[UiPageRollbackRow] =
    InMemoryStore.uiPageRollbacks.indexWhere(_.pageId == pageId) match {
      case -1 => None
      case index =>
        val deleted = InMemoryStore.uiPageRollbacks(index)
        InMemoryStore.uiPageRollbacks = InMemoryStore.uiPageRollbacks.patch(index, Nil, 1)
        Some(deleted)
    }
}
