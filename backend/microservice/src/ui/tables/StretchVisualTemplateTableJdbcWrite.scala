package microservice.ui.tables

import java.sql.Connection

private[tables] object StretchVisualTemplateTableJdbcWrite {
  def insert(connection: Connection, row: StretchVisualTemplateRow): StretchVisualTemplateRow = {
    val statement = connection.prepareStatement(
      """
        INSERT INTO ui_stretch_visual_templates (id, name, source_data_url, kind, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
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

  def update(connection: Connection, row: StretchVisualTemplateRow): Option[StretchVisualTemplateRow] = {
    val statement = connection.prepareStatement(
      """
        UPDATE ui_stretch_visual_templates
        SET name = ?, source_data_url = ?, kind = ?, created_at = ?, updated_at = ?
        WHERE id = ?
      """
    )
    try {
      statement.setString(1, row.name)
      statement.setString(2, row.sourceDataUrl)
      statement.setString(3, row.kind.value)
      statement.setString(4, row.createdAt)
      statement.setString(5, row.updatedAt)
      statement.setString(6, row.id)
      if (statement.executeUpdate() == 0) None else Some(row)
    } finally {
      statement.close()
    }
  }

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
