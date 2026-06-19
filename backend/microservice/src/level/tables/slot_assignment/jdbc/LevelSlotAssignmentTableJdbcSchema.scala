/** 关卡槽位表的 PostgreSQL DDL 与索引（JDBC 模式首次 initialize 时执行）。
  *
  * 关联：关卡模块 Table 门面在 JDBC 模式下 startup 时调用。
  */
package microservice.level.tables.slot_assignment.jdbc

/** LevelSlotAssignmentTableJdbcSchema 表访问门面。
  *
  * 表职责：封装 levelslotassignmentjdbcschema 数据的 CRUD。
  * Row↔Object 映射：通过 RowMapper/Codec 与领域对象互转。
  * inmemory/jdbc 双实现：connection == null 走 InMemoryStore，否则走 JDBC SQL。
  */
import microservice.level.tables.shared.LevelSlotAssignmentRow

import microservice.level.tables.slot_assignment._

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
