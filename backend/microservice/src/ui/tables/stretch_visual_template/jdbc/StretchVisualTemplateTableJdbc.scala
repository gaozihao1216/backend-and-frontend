package microservice.ui.tables.stretch_visual_template.jdbc

import java.sql.Connection
import java.sql.{Connection, ResultSet}
import microservice.ui.objects.stretch_template.StretchVisualTemplateKind
import microservice.ui.tables.stretch_visual_template._

private[tables] object StretchVisualTemplateTableJdbc {
/** 创建 stretch_visual_templates 表及 kind 索引。 */
  def initialize(connection: Connection): Unit = {
    val statement = connection.createStatement()
    try {
      statement.executeUpdate(
        """
          CREATE TABLE IF NOT EXISTS ui_stretch_visual_templates (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            source_data_url TEXT NOT NULL,
            kind TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT 'smallPanel',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        """
      )
      statement.executeUpdate(
        "ALTER TABLE ui_stretch_visual_templates ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'smallPanel'"
      )
      statement.executeUpdate(
        """
          UPDATE ui_stretch_visual_templates
          SET category = 'button'
          WHERE kind = 'pattern'
            AND category NOT IN ('diamond', 'coin', 'button', 'level')
        """
      )
      statement.executeUpdate(
        """
          UPDATE ui_stretch_visual_templates
          SET category = 'smallPanel'
          WHERE kind = 'panel'
            AND category NOT IN ('smallPanel', 'levelBackground')
        """
      )
      statement.executeUpdate("CREATE INDEX IF NOT EXISTS ui_stretch_visual_templates_kind_idx ON ui_stretch_visual_templates(kind)")
      statement.executeUpdate("CREATE INDEX IF NOT EXISTS ui_stretch_visual_templates_name_idx ON ui_stretch_visual_templates(name)")
    } finally {
      statement.close()
    }
  }

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
    StretchVisualTemplateTableJdbc.findById(connection, templateId).flatMap { row =>
      val statement = connection.prepareStatement("DELETE FROM ui_stretch_visual_templates WHERE id = ?")
      try {
        statement.setString(1, templateId)
        if (statement.executeUpdate() == 0) None else Some(row)
      } finally {
        statement.close()
      }
    }
}
