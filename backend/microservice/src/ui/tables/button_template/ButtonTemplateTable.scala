package microservice.ui.tables.button_template

import java.sql.Connection
import java.sql.{Connection, ResultSet}
import microservice.ui.tables.button_template._

object ButtonTemplateTable {
/** 创建 button_templates 表。 */

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

/** INSERT 新按钮模板行。 */
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

  /** UPDATE 已有行。 */
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

  /** DELETE 并返回被删行。 */
  def deleteById(connection: Connection, templateId: String): Option[ButtonTemplateRow] =
    ButtonTemplateTable.findById(connection, templateId).flatMap { row =>
      val statement = connection.prepareStatement("DELETE FROM ui_button_templates WHERE id = ?")
      try {
        statement.setString(1, templateId)
        if (statement.executeUpdate() == 0) None else Some(row)
      } finally {
        statement.close()
      }
    }
}
