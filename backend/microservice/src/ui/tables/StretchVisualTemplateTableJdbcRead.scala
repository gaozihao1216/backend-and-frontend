package microservice.ui.tables

import java.sql.{Connection, ResultSet}
import microservice.ui.objects.StretchVisualTemplateKind

private[tables] object StretchVisualTemplateTableJdbcRead {
  def listByKind(connection: Connection, kind: StretchVisualTemplateKind): Vector[StretchVisualTemplateRow] = {
    val statement = connection.prepareStatement(s"${StretchVisualTemplateTableCodec.baseSelect} WHERE kind = ? ORDER BY id ASC")
    try {
      statement.setString(1, kind.value)
      rows(statement.executeQuery())
    } finally {
      statement.close()
    }
  }

  def findById(connection: Connection, templateId: String): Option[StretchVisualTemplateRow] = {
    val statement = connection.prepareStatement(s"${StretchVisualTemplateTableCodec.baseSelect} WHERE id = ?")
    try {
      statement.setString(1, templateId)
      val resultSet = statement.executeQuery()
      try {
        if (resultSet.next()) Some(StretchVisualTemplateTableCodec.rowFromResultSet(resultSet)) else None
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

  private def rows(resultSet: ResultSet): Vector[StretchVisualTemplateRow] =
    try {
      val builder = Vector.newBuilder[StretchVisualTemplateRow]
      while (resultSet.next()) {
        builder += StretchVisualTemplateTableCodec.rowFromResultSet(resultSet)
      }
      builder.result()
    } finally {
      resultSet.close()
    }
}
