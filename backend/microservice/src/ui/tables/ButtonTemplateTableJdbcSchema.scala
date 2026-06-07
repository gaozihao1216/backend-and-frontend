package microservice.ui.tables

import java.sql.Connection

private[tables] object ButtonTemplateTableJdbcSchema {
  def initialize(connection: Connection): Unit = {
    val statement = connection.createStatement()
    try {
      statement.executeUpdate(
        """
          CREATE TABLE IF NOT EXISTS ui_button_templates (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            source_data_url TEXT NOT NULL,
            scaling_mode TEXT NOT NULL DEFAULT 'fixedAspect',
            slice TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        """
      )
      statement.executeUpdate(
        "ALTER TABLE ui_button_templates ADD COLUMN IF NOT EXISTS scaling_mode TEXT NOT NULL DEFAULT 'fixedAspect'"
      )
      statement.executeUpdate("CREATE INDEX IF NOT EXISTS ui_button_templates_name_idx ON ui_button_templates(name)")
    } finally {
      statement.close()
    }
  }
}
