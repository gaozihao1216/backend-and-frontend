/** 关卡表的 PostgreSQL DDL 与索引（JDBC 模式首次 initialize 时执行）。
  *
  * 关联：关卡模块 Table 门面在 JDBC 模式下 startup 时调用。
  */
package microservice.level.tables.level.jdbc

/** LevelTableJdbcSchema 表访问门面。
  *
  * 表职责：封装 leveljdbcschema 数据的 CRUD。
  * Row↔Object 映射：通过 RowMapper/Codec 与领域对象互转。
  * inmemory/jdbc 双实现：connection == null 走 InMemoryStore，否则走 JDBC SQL。
  */
import microservice.level.tables.shared.LevelRow

import microservice.level.tables.level._

import java.sql.Connection

private[tables] object LevelTableJdbcSchema {
  def initialize(connection: Connection): Unit = {
    val statement = connection.createStatement()
    try {
      statement.executeUpdate(
        """
          CREATE TABLE IF NOT EXISTS levels (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            tags TEXT NOT NULL,
            data TEXT NOT NULL,
            author_id TEXT NOT NULL REFERENCES users(id),
            status TEXT NOT NULL,
            rejection_reason TEXT,
            average_rating DOUBLE PRECISION NOT NULL,
            rating_count INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            published_at TEXT
          )
        """
      )
    } finally {
      statement.close()
    }
  }
}
