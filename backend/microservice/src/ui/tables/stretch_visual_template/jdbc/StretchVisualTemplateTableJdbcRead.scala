/** 拉伸视觉模板表的 JDBC 只读查询。
  *
  * 实现：PreparedStatement + Codec.rowFromResultSet；由 Table 门面在 connection != null 时委托。
  */
package microservice.ui.tables.stretch_visual_template.jdbc

import microservice.ui.tables.stretch_visual_template._

import java.sql.{Connection, ResultSet}
import microservice.ui.objects.StretchVisualTemplateKind

/** stretch_visual_templates 表 JDBC 读操作（含 listByKind）。
  */
private[tables] object StretchVisualTemplateTableJdbcRead {
  /** 按 kind 过滤查询。 */
  def listByKind(connection: Connection, kind: StretchVisualTemplateKind): Vector[StretchVisualTemplateRow] = {
    val statement = connection.prepareStatement(s"${StretchVisualTemplateTableCodec.baseSelect} WHERE kind = ? ORDER BY id ASC")
    try {
      statement.setString(1, kind.value)
      rows(statement.executeQuery())
    } finally {
      statement.close()
    }
  }

  /** 按 id 查询单条。 */
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
