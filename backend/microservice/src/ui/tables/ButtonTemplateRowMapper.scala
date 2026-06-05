package microservice.ui.tables

import microservice.ui.objects.ButtonTemplate

object ButtonTemplateRowMapper {
  def toButtonTemplate(row: ButtonTemplateRow): ButtonTemplate =
    ButtonTemplate(
      id = row.id,
      name = row.name,
      sourceDataUrl = row.sourceDataUrl,
      slice = row.slice,
      createdAt = Some(row.createdAt),
      updatedAt = Some(row.updatedAt)
    )

  def fromButtonTemplate(template: ButtonTemplate, createdAt: String, updatedAt: String): ButtonTemplateRow =
    ButtonTemplateRow(
      id = template.id,
      name = template.name,
      sourceDataUrl = template.sourceDataUrl,
      slice = template.slice,
      createdAt = createdAt,
      updatedAt = updatedAt
    )
}
