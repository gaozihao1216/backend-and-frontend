package microservice.level.tables

import java.sql.Connection

private[tables] object LevelSlotAssignmentTableJdbcSchema {
  def initialize(connection: Connection): Unit = {
    val statement = connection.createStatement()
    try {
      statement.executeUpdate(
        """
          CREATE TABLE IF NOT EXISTS level_slot_assignments (
            id TEXT PRIMARY KEY,
            level_suffix TEXT NOT NULL UNIQUE,
            submission_id TEXT NOT NULL UNIQUE REFERENCES submissions(id),
            source_level_id TEXT NOT NULL REFERENCES levels(id),
            assigned_by_id TEXT NOT NULL REFERENCES users(id),
            assigned_at TEXT NOT NULL,
            note TEXT,
            bird_pool_json TEXT
          )
        """
      )
      statement.executeUpdate(
        """
          ALTER TABLE level_slot_assignments
          ADD COLUMN IF NOT EXISTS bird_pool_json TEXT
        """
      )
    } finally {
      statement.close()
    }
  }
}
