/** 每周签到表的 PostgreSQL DDL 与索引（JDBC 模式首次 initialize 时执行）。
  *
  * 关联：玩家模块 Table 门面在 JDBC 模式下 startup 时调用。
  */
package microservice.player.tables.weekly_check_in.jdbc

import microservice.player.tables.weekly_check_in._

import java.sql.Connection

private[tables] object PlayerWeeklyCheckInTableJdbcSchema {
  def initialize(connection: Connection): Unit = {
    val statement = connection.createStatement()
    try {
      statement.executeUpdate(
        """
          CREATE TABLE IF NOT EXISTS player_weekly_check_ins (
            user_id TEXT NOT NULL REFERENCES users(id),
            week_key TEXT NOT NULL,
            signed_slots TEXT NOT NULL DEFAULT '',
            signed_today BOOLEAN NOT NULL DEFAULT FALSE,
            updated_at TEXT NOT NULL,
            PRIMARY KEY (user_id, week_key)
          )
        """
      )
    } finally {
      statement.close()
    }
  }
}
