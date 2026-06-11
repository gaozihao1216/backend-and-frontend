/** 拉伸视觉模板表在存储层的行模型（与 PostgreSQL 表列一一对应）。
  *
  * 不直接作为 API 响应；经 RowMapper 转为 objects 包中的领域对象。
  */
package microservice.ui.tables.stretch_visual_template

import microservice.ui.objects.StretchVisualTemplateKind

final case class StretchVisualTemplateRow(
  id: String,
  name: String,
  sourceDataUrl: String,
  kind: StretchVisualTemplateKind,
  category: String,
  createdAt: String,
  updatedAt: String
)
