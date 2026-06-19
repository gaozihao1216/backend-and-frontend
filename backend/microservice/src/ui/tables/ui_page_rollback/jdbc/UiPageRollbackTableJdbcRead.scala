package microservice.ui.tables.ui_page_rollback.jdbc

import microservice.ui.tables.ui_page_rollback.{UiPageRollbackRow, UiPageRollbackTableCodec}

import java.sql.Connection

private[tables] object UiPageRollbackTableJdbcRead {
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
