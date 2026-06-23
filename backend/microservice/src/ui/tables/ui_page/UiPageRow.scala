/** UI 页面表在存储层的行模型（与 PostgreSQL 表列一一对应）。
  *
  * 不直接作为 API 响应；经 RowMapper 转为 objects 包中的领域对象。
  */
package microservice.ui.tables.ui_page

import microservice.ui.objects.component.PageComponent
import microservice.ui.objects.page.PageLayout
import microservice.ui.objects.UiEndpoint

/** UI 页面持久化行（layout/components 以 JSON 嵌入）。
  *
  * 定义：ui_pages 表一行；layout 与 components 列存 JSON。
  * 关联：UiPageRowMapper.toPageConfig 转为 API 领域对象。
  */
final case class UiPageRow(
  /** 页面唯一 id，主键。 */
  id: String,
  /** 页面显示名称。 */
  name: String,
  /** 前端路由 path。 */
  path: String,
  /** 所属角色端点（player/designer/admin/director）。 */
  roleScope: UiEndpoint,
  /** 页面布局 JSON 对象。 */
  layout: PageLayout,
  /** 页面组件列表 JSON 数组。 */
  components: List[PageComponent],
  /** 创建时间 ISO-8601 字符串。 */
  createdAt: String,
  /** 最后更新时间 ISO-8601 字符串。 */
  updatedAt: String
)
