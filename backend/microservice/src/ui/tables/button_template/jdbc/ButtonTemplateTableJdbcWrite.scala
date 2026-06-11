/** 按钮模板表的 JDBC 写操作（INSERT/UPDATE/DELETE）。
  *
  * 实现：PreparedStatement + Codec.bindRow；写成功后必要时 re-read 返回最新行。
  */
package microservice.ui.tables.button_template.jdbc

import microservice.ui.tables.button_template._

import java.sql.Connection

private[tables] object ButtonTemplateTableJdbcWrite {
  def insert(connection: Connection, row: ButtonTemplateRow): ButtonTemplateRow = {
    val statement = connection.prepareStatement(
      """
        INSERT INTO ui_button_templates (id, name, source_data_url, category, scaling_mode, slice, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      """
    )
    try {
      ButtonTemplateTableCodec.bindRow(statement, row)
      statement.executeUpdate()
      row
    } finally {
      statement.close()
    }
  }

  def update(connection: Connection, row: ButtonTemplateRow): Option[ButtonTemplateRow] = {
    val statement = connection.prepareStatement(
      """
        UPDATE ui_button_templates
        SET name = ?, source_data_url = ?, category = ?, scaling_mode = ?, slice = ?, created_at = ?, updated_at = ?
        WHERE id = ?
      """
    )
    try {
      statement.setString(1, row.name)
      statement.setString(2, row.sourceDataUrl)
      statement.setString(3, row.category)
      statement.setString(4, row.scalingMode.value)
      statement.setString(5, ButtonTemplateTableCodec.sliceToDb(row.slice))
      statement.setString(6, row.createdAt)
      statement.setString(7, row.updatedAt)
      statement.setString(8, row.id)
      if (statement.executeUpdate() == 0) None else Some(row)
    } finally {
      statement.close()
    }
  }

  def deleteById(connection: Connection, templateId: String): Option[ButtonTemplateRow] =
    ButtonTemplateTableJdbcRead.findById(connection, templateId).flatMap { row =>
      val statement = connection.prepareStatement("DELETE FROM ui_button_templates WHERE id = ?")
      try {
        statement.setString(1, templateId)
        if (statement.executeUpdate() == 0) None else Some(row)
      } finally {
        statement.close()
      }
    }
}
