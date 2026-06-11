/** 收藏表的 PostgreSQL DDL 与索引（JDBC 模式首次 initialize 时执行）。
  *
  * 关联：关卡模块 Table 门面在 JDBC 模式下 startup 时调用。
  */
package microservice.level.tables.favorite.jdbc

import microservice.level.tables.shared.LevelRow

import microservice.level.tables.favorite._

import java.sql.Connection

private[tables] object FavoriteTableJdbcSchema {
  def initialize(connection: Connection): Unit = {
    val statement = connection.createStatement()
    try {
      statement.executeUpdate(
        """
          CREATE TABLE IF NOT EXISTS favorites (
            id TEXT PRIMARY KEY,
            level_id TEXT NOT NULL REFERENCES levels(id),
            user_id TEXT NOT NULL REFERENCES users(id),
            created_at TEXT NOT NULL,
            UNIQUE (level_id, user_id)
          )
        """
      )
    } finally {
      statement.close()
    }
  }
}
