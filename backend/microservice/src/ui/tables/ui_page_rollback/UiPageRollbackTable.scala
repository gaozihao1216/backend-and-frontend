package microservice.ui.tables.ui_page_rollback

import microservice.ui.tables.ui_page_rollback.inmemory.UiPageRollbackTableInMemory
import microservice.ui.tables.ui_page_rollback.jdbc.{
  UiPageRollbackTableJdbcRead,
  UiPageRollbackTableJdbcSchema,
  UiPageRollbackTableJdbcWrite
}

import java.sql.Connection

object UiPageRollbackTable {
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  def initialize(connection: Connection): Unit = {
    if (!isInMemory(connection)) UiPageRollbackTableJdbcSchema.initialize(connection)
  }

  def findById(connection: Connection, pageId: String): Option[UiPageRollbackRow] =
    if (isInMemory(connection)) UiPageRollbackTableInMemory.findById(pageId)
    else UiPageRollbackTableJdbcRead.findById(connection, pageId)

  def upsert(connection: Connection, row: UiPageRollbackRow): UiPageRollbackRow =
    if (isInMemory(connection)) UiPageRollbackTableInMemory.upsert(row)
    else UiPageRollbackTableJdbcWrite.upsert(connection, row)

  def deleteById(connection: Connection, pageId: String): Option[UiPageRollbackRow] =
    if (isInMemory(connection)) UiPageRollbackTableInMemory.deleteById(pageId)
    else UiPageRollbackTableJdbcWrite.deleteById(connection, pageId)
}
