package microservice.ui.tables.ui_page_rollback.jdbc

import microservice.ui.tables.ui_page_rollback.{UiPageRollbackRow, UiPageRollbackTableCodec}

import java.sql.Connection

/** ui_page_rollbacks 表的 JDBC 读操作。
  *
  * 实现：PreparedStatement + UiPageRollbackTableCodec.rowFromResultSet。
  * 关联：UiPageRollbackTable.findById 在 JDBC 模式下委托到此。
  */
private[tables] object UiPageRollbackTableJdbcRead {
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
}
