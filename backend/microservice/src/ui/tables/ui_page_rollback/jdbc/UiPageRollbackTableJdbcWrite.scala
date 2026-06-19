package microservice.ui.tables.ui_page_rollback.jdbc

import microservice.ui.tables.ui_page_rollback.{UiPageRollbackRow, UiPageRollbackTableCodec}

import java.sql.Connection

private[tables] object UiPageRollbackTableJdbcWrite {
  def upsert(connection: Connection, row: UiPageRollbackRow): UiPageRollbackRow = {
    val statement = connection.prepareStatement(
      """
        INSERT INTO ui_page_rollbacks (page_id, page_json, created_at)
        VALUES (?, ?, ?)
        ON CONFLICT (page_id) DO UPDATE SET
          page_json = EXCLUDED.page_json,
          created_at = EXCLUDED.created_at
      """
    )
    try {
      UiPageRollbackTableCodec.bindRow(statement, row)
      statement.executeUpdate()
      row
    } finally {
      statement.close()
    }
  }

  def deleteById(connection: Connection, pageId: String): Option[UiPageRollbackRow] =
    UiPageRollbackTableJdbcRead.findById(connection, pageId).flatMap { row =>
      val statement = connection.prepareStatement("DELETE FROM ui_page_rollbacks WHERE page_id = ?")
      try {
        statement.setString(1, pageId)
        if (statement.executeUpdate() > 0) Some(row) else None
      } finally {
        statement.close()
      }
    }
}
