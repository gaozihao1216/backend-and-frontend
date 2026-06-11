/** 按钮模板表在存储层的行模型（与 PostgreSQL 表列一一对应）。
  *
  * 不直接作为 API 响应；经 RowMapper 转为 objects 包中的领域对象。
  */
package microservice.ui.tables.button_template

import microservice.ui.objects.{ButtonTemplateScalingMode, ButtonTemplateSlice}

final case class ButtonTemplateRow(
  id: String,
  name: String,
  sourceDataUrl: String,
  category: String,
  scalingMode: ButtonTemplateScalingMode,
  slice: ButtonTemplateSlice,
  createdAt: String,
  updatedAt: String
)
