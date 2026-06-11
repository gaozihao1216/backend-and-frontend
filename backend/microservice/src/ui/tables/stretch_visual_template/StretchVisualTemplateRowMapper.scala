/** 持久化 Row 与领域/API 对象之间的映射器。
  *
  * 实现：纯字段拷贝，不含业务逻辑；Table 层返回 Row，上层经此转为对外 DTO。
  */
package microservice.ui.tables.stretch_visual_template

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
