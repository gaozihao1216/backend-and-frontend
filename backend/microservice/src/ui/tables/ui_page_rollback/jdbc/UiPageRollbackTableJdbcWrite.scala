package microservice.ui.tables.ui_page_rollback.jdbc

import microservice.ui.tables.ui_page_rollback.{UiPageRollbackRow, UiPageRollbackTableCodec}

import java.sql.Connection

/** ui_page_rollbacks 表的 JDBC 写操作（UPSERT / DELETE）。
  *
  * 实现：ON CONFLICT DO UPDATE 实现每页单快照覆盖；删除前先 read 返回被删行。
  * 关联：UiPageRollbackTable.upsert / deleteById 在 JDBC 模式下委托到此。
  */
private[tables] object UiPageRollbackTableJdbcWrite {
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
    UiPageRollbackTableJdbcRead.findById(connection, pageId).flatMap { row =>
      val statement = connection.prepareStatement("DELETE FROM ui_page_rollbacks WHERE page_id = ?")
      try {
        statement.setString(1, pageId)
        if (statement.executeUpdate() > 0) Some(row) else None
      } finally {
        statement.close()
      }
    }
}
