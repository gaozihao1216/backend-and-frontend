/** JDBC 读路径专用：SQL 列名 ↔ 拉伸视觉模板 Row 的编解码。
  *
  * 实现：baseSelect 复用 SELECT 片段；rowFromResultSet / bindRow 与 PostgreSQL snake_case 列对齐。
  */
package microservice.ui.tables.stretch_visual_template

import java.sql.{PreparedStatement, ResultSet}
import microservice.ui.objects.stretch_template.StretchVisualTemplate
import microservice.ui.objects.stretch_template.StretchVisualTemplateKind

/** JDBC 读路径：stretch_visual_templates 表列 ↔ Row 编解码。
  *
  * 关联：StretchVisualTemplateTableJdbcRead / Write。
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
