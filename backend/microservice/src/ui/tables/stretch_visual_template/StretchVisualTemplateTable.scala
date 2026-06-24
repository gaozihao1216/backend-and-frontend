package microservice.ui.tables.stretch_visual_template

import microservice.ui.objects.stretch_template.StretchVisualTemplateKind
import microservice.ui.objects.stretch_template.StretchVisualTemplate
import java.sql.{PreparedStatement, ResultSet}
import java.sql.Connection
import java.sql.{Connection, ResultSet}
import microservice.ui.tables.stretch_visual_template._

/** 拉伸视觉模板持久化行（含 kind 与 category）。
  *
  * 定义：ui_stretch_visual_templates 表一行。
  * 关联：StretchVisualTemplateRowMapper.toStretchVisualTemplate 转为领域对象。
  */
final case class StretchVisualTemplateRow(
  /** 模板唯一 id，主键。 */
  id: String,
  /** 模板显示名称。 */
  name: String,
  /** 源图 data URL。 */
  sourceDataUrl: String,
  /** 模板类型（panel/pattern）。 */
  kind: StretchVisualTemplateKind,
  /** 业务分类。 */
  category: String,
  /** 创建时间。 */
  createdAt: String,
  /** 最后更新时间。 */
  updatedAt: String
)

/** StretchVisualTemplateRow ↔ StretchVisualTemplate 映射器。
  *
  * 实现：纯字段拷贝；createdAt/updatedAt 在 Row 为必填，领域对象为 Option。
  */
object StretchVisualTemplateRowMapper {
  /** StretchVisualTemplateRow → StretchVisualTemplate。 */
  def toStretchVisualTemplate(row: StretchVisualTemplateRow): StretchVisualTemplate =
    StretchVisualTemplate(
      id = row.id,
      name = row.name,
      sourceDataUrl = row.sourceDataUrl,
      kind = row.kind,
      category = row.category,
      createdAt = Some(row.createdAt),
      updatedAt = Some(row.updatedAt)
    )

  /** StretchVisualTemplate → StretchVisualTemplateRow。 */
  def fromStretchVisualTemplate(template: StretchVisualTemplate, createdAt: String, updatedAt: String): StretchVisualTemplateRow =
    StretchVisualTemplateRow(
      id = template.id,
      name = template.name,
      sourceDataUrl = template.sourceDataUrl,
      kind = template.kind,
      category = template.category,
      createdAt = createdAt,
      updatedAt = updatedAt
    )
}

/** JDBC 读路径：stretch_visual_templates 表列 ↔ Row 编解码。
  *
  * 关联：StretchVisualTemplateTable。
  */
private[tables] object StretchVisualTemplateTableCodec {
  /** stretch_visual_templates 表通用 SELECT 列清单。 */
  val baseSelect: String =
    """
      SELECT id, name, source_data_url, kind, category, created_at, updated_at
      FROM ui_stretch_visual_templates
    """

  /** 绑定 INSERT/UPDATE 占位符。 */
  def bindRow(statement: PreparedStatement, row: StretchVisualTemplateRow): Unit = {
    statement.setString(1, row.id)
    statement.setString(2, row.name)
    statement.setString(3, row.sourceDataUrl)
    statement.setString(4, row.kind.value)
    statement.setString(5, row.category)
    statement.setString(6, row.createdAt)
    statement.setString(7, row.updatedAt)
  }

  /** 从 ResultSet 解析 StretchVisualTemplateRow。 */
  def rowFromResultSet(resultSet: ResultSet): StretchVisualTemplateRow = {
    val kind = StretchVisualTemplateKind.fromString(resultSet.getString("kind")).getOrElse(StretchVisualTemplateKind.Panel)
    val rawCategory = Option(resultSet.getString("category")).filter(_.nonEmpty).getOrElse(StretchVisualTemplate.defaultCategoryForKind(kind))
    StretchVisualTemplateRow(
      id = resultSet.getString("id"),
      name = resultSet.getString("name"),
      sourceDataUrl = resultSet.getString("source_data_url"),
      kind = kind,
      category = StretchVisualTemplate.normalizeCategoryForKind(kind, rawCategory),
      createdAt = resultSet.getString("created_at"),
      updatedAt = resultSet.getString("updated_at")
    )
  }
}

object StretchVisualTemplateTable {
/** 创建 stretch_visual_templates 表及 kind 索引。 */

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
    StretchVisualTemplateTable.findById(connection, templateId).flatMap { row =>
      val statement = connection.prepareStatement("DELETE FROM ui_stretch_visual_templates WHERE id = ?")
      try {
        statement.setString(1, templateId)
        if (statement.executeUpdate() == 0) None else Some(row)
      } finally {
        statement.close()
      }
    }
}
