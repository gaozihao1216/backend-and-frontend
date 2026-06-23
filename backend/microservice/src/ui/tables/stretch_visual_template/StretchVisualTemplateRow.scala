/** 拉伸视觉模板表在存储层的行模型（与 PostgreSQL 表列一一对应）。
  *
  * 不直接作为 API 响应；经 RowMapper 转为 objects 包中的领域对象。
  */
package microservice.ui.tables.stretch_visual_template

import microservice.ui.objects.stretch_template.StretchVisualTemplateKind

/** 拉伸视觉模板持久化行（含 kind 与 category）。
  *
  * 定义：ui_stretch_visual_templates 表一行。
  * 关联：StretchVisualTemplateRowMapper.toStretchVisualTemplate 转为领域对象。
  */
final case class StretchVisualTemplateRow(
  /** 模板唯一 id，主键。 */
  id: String,
  /** 模板显示名称。 */
  name: String,
  /** 源图 data URL。 */
  sourceDataUrl: String,
  /** 模板类型（panel/pattern）。 */
  kind: StretchVisualTemplateKind,
  /** 业务分类。 */
  category: String,
  /** 创建时间。 */
  createdAt: String,
  /** 最后更新时间。 */
  updatedAt: String
)
