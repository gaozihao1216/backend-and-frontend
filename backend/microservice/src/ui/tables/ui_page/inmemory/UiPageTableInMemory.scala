/** InMemoryStore 上的 UI 页面 CRUD；演示模式与单元测试使用。
  *
  * 关联：UI 定制模块 Table 门面在 connection == null 时委托到此实现。
  */
package microservice.ui.tables.ui_page.inmemory

import microservice.ui.tables.ui_page._

import microservice.infrastructure.database.InMemoryStore
import microservice.ui.objects.{PageComponent, UiEndpoint}

private[tables] object UiPageTableInMemory {
  /** 返回 InMemoryStore 中全部页面行。 */
  def listAll(): Vector[UiPageRow] =
    InMemoryStore.uiPages.sortBy(_.id)

  /** 按 roleScope 过滤页面列表。 */
  def listByEndpoint(endpoint: UiEndpoint): Vector[UiPageRow] =
    listAll().filter(_.roleScope == endpoint)

  /** 按 pageId 查找单页。 */
  def findById(pageId: String): Option[UiPageRow] =
    InMemoryStore.uiPages.find(_.id == pageId)

  /** 追加新页面行到 InMemoryStore。 */
  def insert(row: UiPageRow): UiPageRow = {
    InMemoryStore.uiPages = InMemoryStore.uiPages :+ row
    row
  }

  /** 更新已有页面行。 */
  def update(row: UiPageRow): Option[UiPageRow] =
    InMemoryStore.uiPages.indexWhere(_.id == row.id) match {
      case -1 => None
      case index =>
        InMemoryStore.uiPages = InMemoryStore.uiPages.updated(index, row)
        Some(row)
    }

  /** 删除页面行并返回被删行。 */
  def deleteById(pageId: String): Option[UiPageRow] =
    InMemoryStore.uiPages.indexWhere(_.id == pageId) match {
      case -1 => None
      case index =>
        val deleted = InMemoryStore.uiPages(index)
        InMemoryStore.uiPages = InMemoryStore.uiPages.patch(index, Nil, 1)
        Some(deleted)
    }

  /** 向页面追加组件（id 不可重复）。 */
  def addComponent(pageId: String, component: PageComponent, updatedAt: String): Option[UiPageRow] =
    findById(pageId).filterNot(_.components.exists(_.id == component.id)).flatMap { row =>
      update(row.copy(components = row.components :+ component, updatedAt = updatedAt))
    }

  /** 更新页面内指定组件。 */
  def updateComponent(pageId: String, componentId: String, component: PageComponent, updatedAt: String): Option[UiPageRow] =
    findById(pageId).filter(_.components.exists(_.id == componentId)).flatMap { row =>
      update(row.copy(
        components = row.components.map(existing => if (existing.id == componentId) component else existing),
        updatedAt = updatedAt
      ))
    }

  /** 从页面移除指定组件。 */
  def deleteComponent(pageId: String, componentId: String, updatedAt: String): Option[UiPageRow] =
    findById(pageId).filter(_.components.exists(_.id == componentId)).flatMap { row =>
      update(row.copy(
        components = row.components.filterNot(_.id == componentId),
        updatedAt = updatedAt
      ))
    }
}
