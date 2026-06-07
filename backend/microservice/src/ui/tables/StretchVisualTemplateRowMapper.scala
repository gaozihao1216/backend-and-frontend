package microservice.ui.tables

import microservice.ui.objects.StretchVisualTemplate

object StretchVisualTemplateRowMapper {
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
