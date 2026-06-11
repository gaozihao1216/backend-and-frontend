/** 玩家进度表的 PostgreSQL DDL 与索引（JDBC 模式首次 initialize 时执行）。
  *
  * 关联：玩家模块 Table 门面在 JDBC 模式下 startup 时调用。
  */
package microservice.player.tables.progress.jdbc

import microservice.player.tables.progress._

import java.sql.Connection

private[tables] object PlayerLevelProgressTableJdbcSchema {
  def initialize(connection: Connection): Unit = {
    val statement = connection.createStatement()
    try {
      statement.executeUpdate(
        """
          CREATE TABLE IF NOT EXISTS player_level_progress (
            user_id TEXT NOT NULL REFERENCES users(id),
            level_suffix TEXT NOT NULL,
            cleared_at TEXT NOT NULL,
            PRIMARY KEY (user_id, level_suffix)
          )
        """
      )
      statement.executeUpdate(
        """
          INSERT INTO player_level_progress (user_id, level_suffix, cleared_at)
          VALUES ('player-1', 'level01', '2026-06-03T00:00:00Z')
          ON CONFLICT (user_id, level_suffix) DO NOTHING
        """
      )
    } finally {
      statement.close()
    }
  }
}

private[tables] object PlayerLegacyCheckInTableJdbcSchema {
  def initialize(connection: Connection): Unit = {
    val statement = connection.createStatement()
    try {
      statement.executeUpdate(
        """
          CREATE TABLE IF NOT EXISTS player_legacy_check_ins (
            user_id TEXT PRIMARY KEY REFERENCES users(id),
            status TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        """
      )
    } finally {
      statement.close()
    }
  }
}
