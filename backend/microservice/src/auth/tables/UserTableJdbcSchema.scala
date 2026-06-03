package microservice.auth.tables

import java.sql.Connection

private[tables] object UserTableJdbcSchema {
  def initialize(connection: Connection): Unit = {
    val statement = connection.createStatement()
    try {
      statement.executeUpdate(
        """
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            display_name TEXT NOT NULL,
            role TEXT NOT NULL,
            admin_level TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        """
      )
      statement.executeUpdate("ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_level TEXT")
      statement.executeUpdate("UPDATE users SET admin_level = 'standard' WHERE role = 'admin' AND admin_level IS NULL")
      statement.executeUpdate(
        """
          INSERT INTO users (id, username, display_name, role, admin_level, created_at, updated_at)
          VALUES (
            'admin-director-1',
            'local-admin-director-0000004',
            'Director Admin',
            'admin',
            'director',
            '2026-06-03T00:00:00Z',
            '2026-06-03T00:00:00Z'
          )
          ON CONFLICT (id) DO NOTHING
        """
      )
    } finally {
      statement.close()
    }
  }
}
