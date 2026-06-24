package microservice.ui.tables.button_template

import microservice.ui.objects.button_template.ButtonTemplateScalingMode
import microservice.ui.objects.button_template.ButtonTemplateSlice
import microservice.ui.objects.button_template.ButtonTemplate
import io.circe.parser.decode
import io.circe.syntax._
import java.sql.{PreparedStatement, ResultSet, SQLException}
import microservice.ui.objects.category.ButtonTemplateCategory
import java.sql.Connection
import java.sql.{Connection, ResultSet}
import microservice.ui.tables.button_template._

/** 按钮模板持久化行（含 scalingMode 与 slice）。
  *
  * 定义：ui_button_templates 表一行。
  * 关联：ButtonTemplateRowMapper.toButtonTemplate 转为 API 领域对象。
  */
final case class ButtonTemplateRow(
  /** 模板唯一 id，主键。 */
  id: String,
  /** 模板显示名称。 */
  name: String,
  /** 源图 data URL。 */
  sourceDataUrl: String,
  /** 业务分类（business/level）。 */
  category: String,
  /** 缩放模式（fixedAspect/nineSlice）。 */
  scalingMode: ButtonTemplateScalingMode,
  /** 九宫格切片边距。 */
  slice: ButtonTemplateSlice,
  /** 创建时间。 */
  createdAt: String,
  /** 最后更新时间。 */
  updatedAt: String
)

object ButtonTemplateRowMapper {
  /** ButtonTemplateRow → ButtonTemplate 领域对象。 */
  def toButtonTemplate(row: ButtonTemplateRow): ButtonTemplate =
    ButtonTemplate(
      id = row.id,
      name = row.name,
      sourceDataUrl = row.sourceDataUrl,
      category = row.category,
      scalingMode = row.scalingMode,
      slice = row.slice,
      createdAt = Some(row.createdAt),
      updatedAt = Some(row.updatedAt)
    )

  /** ButtonTemplate → ButtonTemplateRow 持久化行。 */
  def fromButtonTemplate(template: ButtonTemplate, createdAt: String, updatedAt: String): ButtonTemplateRow =
    ButtonTemplateRow(
      id = template.id,
      name = template.name,
      sourceDataUrl = template.sourceDataUrl,
      category = template.category,
      scalingMode = template.scalingMode,
      slice = template.slice,
      createdAt = createdAt,
      updatedAt = updatedAt
    )
}

/** JDBC 读路径：button_templates 表列 ↔ ButtonTemplateRow 编解码。
  *
  * 实现：slice 以 JSON 存储；scaling_mode 存字符串枚举值。
  * 关联：ButtonTemplateTable。
  */
private[tables] object ButtonTemplateTableCodec {
  /** button_templates 表通用 SELECT 列清单。 */
  val baseSelect: String =
    """
      SELECT id, name, source_data_url, category, scaling_mode, slice, created_at, updated_at
      FROM ui_button_templates
    """

  def sliceToDb(slice: ButtonTemplateSlice): String =
    slice.asJson.noSpaces

  /** 绑定 INSERT/UPDATE 占位符。 */
  def bindRow(statement: PreparedStatement, row: ButtonTemplateRow): Unit = {
    statement.setString(1, row.id)
    statement.setString(2, row.name)
    statement.setString(3, row.sourceDataUrl)
    statement.setString(4, row.category)
    statement.setString(5, row.scalingMode.value)
    statement.setString(6, sliceToDb(row.slice))
    statement.setString(7, row.createdAt)
    statement.setString(8, row.updatedAt)
  }

  /** 从 ResultSet 解析 ButtonTemplateRow（含 slice JSON）。 */
  def rowFromResultSet(resultSet: ResultSet): ButtonTemplateRow =
    ButtonTemplateRow(
      id = resultSet.getString("id"),
      name = resultSet.getString("name"),
      sourceDataUrl = resultSet.getString("source_data_url"),
      category = Option(resultSet.getString("category")).filter(_.nonEmpty).getOrElse(ButtonTemplateCategory.defaultValue),
      scalingMode = ButtonTemplateScalingMode.fromString(resultSet.getString("scaling_mode")).getOrElse(ButtonTemplateScalingMode.FixedAspect),
      slice = sliceFromDb(resultSet.getString("slice")),
      createdAt = resultSet.getString("created_at"),
      updatedAt = resultSet.getString("updated_at")
    )

  private def sliceFromDb(value: String): ButtonTemplateSlice =
    decode[ButtonTemplateSlice](value).fold(
      error => throw new SQLException(s"Invalid UI button template slice JSON: ${error.getMessage}", error),
      identity
    )
}

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
