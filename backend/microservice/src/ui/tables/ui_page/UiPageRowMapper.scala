/** 持久化 Row 与领域/API 对象之间的映射器。
  *
  * 实现：纯字段拷贝，不含业务逻辑；Table 层返回 Row，上层经此转为对外 DTO。
  */
package microservice.ui.tables.ui_page

import microservice.ui.objects.page.PageConfig

object UiPageRowMapper {
  /** UiPageRow → PageConfig 领域对象。 */
  def toPageConfig(row: UiPageRow): PageConfig =
    PageConfig(
      id = row.id,
      name = row.name,
      path = row.path,
      roleScope = row.roleScope,
      layout = row.layout,
      components = row.components
    )

  /** PageConfig → UiPageRow 持久化行（附带时间戳）。 */
  def fromPageConfig(config: PageConfig, createdAt: String, updatedAt: String): UiPageRow =
    UiPageRow(
      id = config.id,
      name = config.name,
      path = config.path,
      roleScope = config.roleScope,
      layout = config.layout,
      components = config.components,
      createdAt = createdAt,
      updatedAt = updatedAt
    )
}
