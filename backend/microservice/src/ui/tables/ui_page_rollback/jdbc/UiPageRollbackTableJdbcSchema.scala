package microservice.ui.tables.ui_page_rollback.jdbc

import java.sql.Connection

private[tables] object UiPageRollbackTableJdbcSchema {
  def initialize(connection: Connection): Unit = {
    val statement = connection.createStatement()
    try {
      statement.executeUpdate(
        """
          CREATE TABLE IF NOT EXISTS ui_page_rollbacks (
            page_id TEXT PRIMARY KEY,
            page_json TEXT NOT NULL,
            created_at TEXT NOT NULL
          )
        """
      )
    } finally {
      statement.close()
    }
  }
}
