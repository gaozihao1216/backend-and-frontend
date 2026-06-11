/** 持久化 Row 与领域/API 对象之间的映射器。
  *
  * 实现：纯字段拷贝，不含业务逻辑；Table 层返回 Row，上层经此转为对外 DTO。
  */
package microservice.ui.tables.button_template

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
