/** 按钮模板表的 JDBC 只读查询。
  *
  * 实现：PreparedStatement + Codec.rowFromResultSet；由 Table 门面在 connection != null 时委托。
  */
package microservice.ui.tables.button_template.jdbc

import microservice.ui.tables.button_template._

import java.sql.{Connection, ResultSet}

/** button_templates 表 JDBC 读操作。
  *
  * 关联：ButtonTemplateTable 读路径委托。
  */
private[tables] object ButtonTemplateTableJdbcRead {
  /** 查询全部按钮模板。 */
  def listAll(connection: Connection): Vector[ButtonTemplateRow] = {
    val statement = connection.prepareStatement(s"${ButtonTemplateTableCodec.baseSelect} ORDER BY id ASC")
    try rows(statement.executeQuery())
    finally statement.close()
  }

  /** 按 id 查询单条。 */
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
