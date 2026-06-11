/** 关卡评论表的 PostgreSQL DDL 与索引（JDBC 模式首次 initialize 时执行）。
  *
  * 关联：关卡模块 Table 门面在 JDBC 模式下 startup 时调用。
  */
package microservice.level.tables.comment.jdbc

import microservice.level.tables.shared.CommentRow

import microservice.level.tables.comment._

import java.sql.Connection

private[tables] object CommentTableJdbcSchema {
  def initialize(connection: Connection): Unit = {
    val statement = connection.createStatement()
    try {
      statement.executeUpdate(
        """
          CREATE TABLE IF NOT EXISTS comments (
            id TEXT PRIMARY KEY,
            level_id TEXT NOT NULL REFERENCES levels(id),
            user_id TEXT NOT NULL REFERENCES users(id),
            content TEXT NOT NULL,
            created_at TEXT NOT NULL
          )
        """
      )
    } finally {
      statement.close()
    }
  }
}
