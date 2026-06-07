package microservice.ui.tables

import microservice.ui.objects.ButtonTemplate

object ButtonTemplateRowMapper {
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
