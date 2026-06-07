package microservice.ui.tables

import java.sql.Connection

private[tables] object StretchVisualTemplateTableJdbcSchema {
  def initialize(connection: Connection): Unit = {
    val statement = connection.createStatement()
    try {
      statement.executeUpdate(
        """
          CREATE TABLE IF NOT EXISTS ui_stretch_visual_templates (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            source_data_url TEXT NOT NULL,
            kind TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT 'smallPanel',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        """
      )
      statement.executeUpdate(
        "ALTER TABLE ui_stretch_visual_templates ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'smallPanel'"
      )
      statement.executeUpdate(
        """
          UPDATE ui_stretch_visual_templates
          SET category = 'button'
          WHERE kind = 'pattern'
            AND category NOT IN ('diamond', 'coin', 'button', 'level')
        """
      )
      statement.executeUpdate(
        """
          UPDATE ui_stretch_visual_templates
          SET category = 'smallPanel'
          WHERE kind = 'panel'
            AND category NOT IN ('smallPanel', 'levelBackground')
        """
      )
      statement.executeUpdate("CREATE INDEX IF NOT EXISTS ui_stretch_visual_templates_kind_idx ON ui_stretch_visual_templates(kind)")
      statement.executeUpdate("CREATE INDEX IF NOT EXISTS ui_stretch_visual_templates_name_idx ON ui_stretch_visual_templates(name)")
    } finally {
      statement.close()
    }
  }
}
