package microservice.ui.tables.ui_page

import microservice.ui.objects.PageConfig

object UiPageRowMapper {
  def toPageConfig(row: UiPageRow): PageConfig =
    PageConfig(
      id = row.id,
      name = row.name,
      path = row.path,
      roleScope = row.roleScope,
      layout = row.layout,
      components = row.components
    )

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
