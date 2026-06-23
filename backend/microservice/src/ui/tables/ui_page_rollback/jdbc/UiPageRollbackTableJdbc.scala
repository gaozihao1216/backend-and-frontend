package microservice.ui.tables.ui_page_rollback.jdbc

import java.sql.Connection
import microservice.ui.tables.ui_page_rollback.{UiPageRollbackRow, UiPageRollbackTableCodec}

private[tables] object UiPageRollbackTableJdbc {
/** 创建 ui_page_rollbacks 表（IF NOT EXISTS）。 */
  def initialize(connection: Connection): Unit = {
    val statement = connection.createStatement()
    try {
      statement.executeUpdate(
        """
          CREATE TABLE IF NOT EXISTS ui_page_rollbacks (
            page_id TEXT PRIMARY KEY,
            page_json TEXT NOT NULL,
            created_at TEXT NOT NULL
          )
        """
      )
    } finally {
      statement.close()
    }
  }

/** 按 pageId 查询单条回滚快照。 */
  def findById(connection: Connection, pageId: String): Option[UiPageRollbackRow] = {
    val statement = connection.prepareStatement(s"${UiPageRollbackTableCodec.baseSelect} WHERE page_id = ?")
    try {
      statement.setString(1, pageId)
      val resultSet = statement.executeQuery()
      try {
        if (resultSet.next()) Some(UiPageRollbackTableCodec.rowFromResultSet(resultSet)) else None
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

/** 插入或覆盖该页的回滚快照。 */
  def upsert(connection: Connection, row: UiPageRollbackRow): UiPageRollbackRow = {
    val statement = connection.prepareStatement(
      """
        INSERT INTO ui_page_rollbacks (page_id, page_json, created_at)
        VALUES (?, ?, ?)
        ON CONFLICT (page_id) DO UPDATE SET
          page_json = EXCLUDED.page_json,
          created_at = EXCLUDED.created_at
      """
    )
    try {
      UiPageRollbackTableCodec.bindRow(statement, row)
      statement.executeUpdate()
      row
    } finally {
      statement.close()
    }
  }

  /** 按 pageId 删除回滚快照并返回被删行。 */
  def deleteById(connection: Connection, pageId: String): Option[UiPageRollbackRow] =
    UiPageRollbackTableJdbc.findById(connection, pageId).flatMap { row =>
      val statement = connection.prepareStatement("DELETE FROM ui_page_rollbacks WHERE page_id = ?")
      try {
        statement.setString(1, pageId)
        if (statement.executeUpdate() > 0) Some(row) else None
      } finally {
        statement.close()
      }
    }
}
