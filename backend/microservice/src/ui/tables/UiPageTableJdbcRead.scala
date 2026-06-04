package microservice.ui.tables

import java.sql.{Connection, ResultSet}
import microservice.ui.objects.UiEndpoint

private[tables] object UiPageTableJdbcRead {
  def listAll(connection: Connection): Vector[UiPageRow] = {
    val statement = connection.prepareStatement(s"${UiPageTableCodec.baseSelect} ORDER BY id ASC")
    try rows(statement.executeQuery())
    finally statement.close()
  }

  def listByEndpoint(connection: Connection, endpoint: UiEndpoint): Vector[UiPageRow] = {
    val statement = connection.prepareStatement(
      s"""
        ${UiPageTableCodec.baseSelect}
        WHERE role_scope = ?
        ORDER BY id ASC
      """
    )
    try {
      statement.setString(1, endpoint.value)
      rows(statement.executeQuery())
    } finally {
      statement.close()
    }
  }

  def findById(connection: Connection, pageId: String): Option[UiPageRow] = {
    val statement = connection.prepareStatement(s"${UiPageTableCodec.baseSelect} WHERE id = ?")
    try {
      statement.setString(1, pageId)
      val resultSet = statement.executeQuery()
      try {
        if (resultSet.next()) Some(UiPageTableCodec.rowFromResultSet(resultSet)) else None
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

  private def rows(resultSet: ResultSet): Vector[UiPageRow] =
    try {
      val builder = Vector.newBuilder[UiPageRow]
      while (resultSet.next()) {
        builder += UiPageTableCodec.rowFromResultSet(resultSet)
      }
      builder.result()
    } finally {
      resultSet.close()
    }
}
