/**
  *
   * 定义：PlayerWeeklyCheckInTableJdbcSchema：PostgreSQL DDL 与迁移/种子 SQL。
 * 问题：JDBC 模式冷启动需建表且与 in-memory 演示数据 id 对齐。
 * 作用：initialize(connection) 执行 CREATE TABLE / ALTER / INSERT ON CONFLICT。
 * 关联：[[PlayerWeeklyCheckInTableTable]] initialize 调用；docker init-store.sql 可对齐。
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
