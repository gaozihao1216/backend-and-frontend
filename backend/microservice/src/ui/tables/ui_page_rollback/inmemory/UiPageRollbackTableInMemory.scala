package microservice.ui.tables.ui_page_rollback.inmemory

import microservice.infrastructure.database.InMemoryStore
import microservice.ui.tables.ui_page_rollback.UiPageRollbackRow

private[tables] object UiPageRollbackTableInMemory {
  def findById(pageId: String): Option[UiPageRollbackRow] =
    InMemoryStore.uiPageRollbacks.find(_.pageId == pageId)

  def upsert(row: UiPageRollbackRow): UiPageRollbackRow = {
    InMemoryStore.uiPageRollbacks.indexWhere(_.pageId == row.pageId) match {
      case -1 =>
        InMemoryStore.uiPageRollbacks = InMemoryStore.uiPageRollbacks :+ row
      case index =>
        InMemoryStore.uiPageRollbacks = InMemoryStore.uiPageRollbacks.updated(index, row)
    }
    row
  }

  def deleteById(pageId: String): Option[UiPageRollbackRow] =
    InMemoryStore.uiPageRollbacks.indexWhere(_.pageId == pageId) match {
      case -1 => None
      case index =>
        val deleted = InMemoryStore.uiPageRollbacks(index)
        InMemoryStore.uiPageRollbacks = InMemoryStore.uiPageRollbacks.patch(index, Nil, 1)
        Some(deleted)
    }
}
