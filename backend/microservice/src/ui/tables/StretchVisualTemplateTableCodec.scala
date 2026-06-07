package microservice.ui.tables

import java.sql.{PreparedStatement, ResultSet}
import microservice.ui.objects.{StretchVisualTemplate, StretchVisualTemplateKind}

private[tables] object StretchVisualTemplateTableCodec {
  val baseSelect: String =
    """
      SELECT id, name, source_data_url, kind, category, created_at, updated_at
      FROM ui_stretch_visual_templates
    """

  def bindRow(statement: PreparedStatement, row: StretchVisualTemplateRow): Unit = {
    statement.setString(1, row.id)
    statement.setString(2, row.name)
    statement.setString(3, row.sourceDataUrl)
    statement.setString(4, row.kind.value)
    statement.setString(5, row.category)
    statement.setString(6, row.createdAt)
    statement.setString(7, row.updatedAt)
  }

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
