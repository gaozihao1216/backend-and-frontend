/** UI 页面表在存储层的行模型（与 PostgreSQL 表列一一对应）。
  *
  * 不直接作为 API 响应；经 RowMapper 转为 objects 包中的领域对象。
  */
package microservice.ui.tables.ui_page

import microservice.ui.objects.{PageComponent, PageLayout, UiEndpoint}

final case class UiPageRow(
  id: String,
  name: String,
  path: String,
  roleScope: UiEndpoint,
  layout: PageLayout,
  components: List[PageComponent],
  createdAt: String,
  updatedAt: String
)
