package microservice.ui.tables.ui_page.jdbc

import microservice.ui.tables.ui_page._

import java.sql.Connection

private[tables] object UiPageTableJdbcSchema {
  def initialize(connection: Connection): Unit = {
    val statement = connection.createStatement()
    try {
      statement.executeUpdate(
        """
          CREATE TABLE IF NOT EXISTS ui_pages (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            path TEXT NOT NULL,
            role_scope TEXT NOT NULL,
            layout TEXT NOT NULL,
            components TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        """
      )
      statement.executeUpdate("CREATE INDEX IF NOT EXISTS ui_pages_role_scope_idx ON ui_pages(role_scope)")
    } finally {
      statement.close()
    }
  }
}
