/** 按钮模板表在存储层的行模型（与 PostgreSQL 表列一一对应）。
  *
  * 不直接作为 API 响应；经 RowMapper 转为 objects 包中的领域对象。
  */
package microservice.ui.tables.button_template

import microservice.ui.objects.{ButtonTemplateScalingMode, ButtonTemplateSlice}

/** 按钮模板持久化行（含 scalingMode 与 slice）。
  *
  * 定义：ui_button_templates 表一行。
  * 关联：ButtonTemplateRowMapper.toButtonTemplate 转为 API 领域对象。
  */
final case class ButtonTemplateRow(
  /** 模板唯一 id，主键。 */
  id: String,
  /** 模板显示名称。 */
  name: String,
  /** 源图 data URL。 */
  sourceDataUrl: String,
  /** 业务分类（business/level）。 */
  category: String,
  /** 缩放模式（fixedAspect/nineSlice）。 */
  scalingMode: ButtonTemplateScalingMode,
  /** 九宫格切片边距。 */
  slice: ButtonTemplateSlice,
  /** 创建时间。 */
  createdAt: String,
  /** 最后更新时间。 */
  updatedAt: String
)
