package microservice.ui.tables.button_template.jdbc

import microservice.ui.tables.button_template._

import java.sql.{Connection, ResultSet}

private[tables] object ButtonTemplateTableJdbcRead {
  def listAll(connection: Connection): Vector[ButtonTemplateRow] = {
    val statement = connection.prepareStatement(s"${ButtonTemplateTableCodec.baseSelect} ORDER BY id ASC")
    try rows(statement.executeQuery())
    finally statement.close()
  }

  def findById(connection: Connection, templateId: String): Option[ButtonTemplateRow] = {
    val statement = connection.prepareStatement(s"${ButtonTemplateTableCodec.baseSelect} WHERE id = ?")
    try {
      statement.setString(1, templateId)
      val resultSet = statement.executeQuery()
      try {
        if (resultSet.next()) Some(ButtonTemplateTableCodec.rowFromResultSet(resultSet)) else None
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

  private def rows(resultSet: ResultSet): Vector[ButtonTemplateRow] =
    try {
      val builder = Vector.newBuilder[ButtonTemplateRow]
      while (resultSet.next()) {
        builder += ButtonTemplateTableCodec.rowFromResultSet(resultSet)
      }
      builder.result()
    } finally {
      resultSet.close()
    }
}
