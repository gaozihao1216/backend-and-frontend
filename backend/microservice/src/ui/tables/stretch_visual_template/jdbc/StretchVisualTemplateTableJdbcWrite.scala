/** 拉伸视觉模板表的 JDBC 写操作（INSERT/UPDATE/DELETE）。
  *
  * 实现：PreparedStatement + Codec.bindRow；写成功后必要时 re-read 返回最新行。
  */
package microservice.ui.tables.stretch_visual_template.jdbc

import microservice.ui.tables.stretch_visual_template._

import java.sql.Connection

/** stretch_visual_templates 表 JDBC 写操作。
  */
private[tables] object StretchVisualTemplateTableJdbcWrite {
  /** INSERT 新模板行。 */
  def insert(connection: Connection, row: StretchVisualTemplateRow): StretchVisualTemplateRow = {
    val statement = connection.prepareStatement(
      """
        INSERT INTO ui_stretch_visual_templates (id, name, source_data_url, kind, category, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      """
    )
    try {
      StretchVisualTemplateTableCodec.bindRow(statement, row)
      statement.executeUpdate()
      row
    } finally {
      statement.close()
    }
  }

  /** UPDATE 已有行。 */
  def update(connection: Connection, row: StretchVisualTemplateRow): Option[StretchVisualTemplateRow] = {
    val statement = connection.prepareStatement(
      """
        UPDATE ui_stretch_visual_templates
        SET name = ?, source_data_url = ?, kind = ?, category = ?, created_at = ?, updated_at = ?
        WHERE id = ?
      """
    )
    try {
      statement.setString(1, row.name)
      statement.setString(2, row.sourceDataUrl)
      statement.setString(3, row.kind.value)
      statement.setString(4, row.category)
      statement.setString(5, row.createdAt)
      statement.setString(6, row.updatedAt)
      statement.setString(7, row.id)
      if (statement.executeUpdate() == 0) None else Some(row)
    } finally {
      statement.close()
    }
  }

  /** DELETE 并返回被删行。 */
  def deleteById(connection: Connection, templateId: String): Option[StretchVisualTemplateRow] =
    StretchVisualTemplateTableJdbcRead.findById(connection, templateId).flatMap { row =>
      val statement = connection.prepareStatement("DELETE FROM ui_stretch_visual_templates WHERE id = ?")
      try {
        statement.setString(1, templateId)
        if (statement.executeUpdate() == 0) None else Some(row)
      } finally {
        statement.close()
      }
    }
}
