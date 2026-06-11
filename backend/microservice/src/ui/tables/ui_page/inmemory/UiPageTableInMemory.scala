/** InMemoryStore 上的 UI 页面 CRUD；演示模式与单元测试使用。
  *
  * 关联：UI 定制模块 Table 门面在 connection == null 时委托到此实现。
  */
package microservice.ui.tables.ui_page.inmemory

import microservice.ui.tables.ui_page._

import microservice.infrastructure.database.InMemoryStore
import microservice.ui.objects.{PageComponent, UiEndpoint}

private[tables] object UiPageTableInMemory {
  def listAll(): Vector[UiPageRow] =
    InMemoryStore.uiPages.sortBy(_.id)

  def listByEndpoint(endpoint: UiEndpoint): Vector[UiPageRow] =
    listAll().filter(_.roleScope == endpoint)

  def findById(pageId: String): Option[UiPageRow] =
    InMemoryStore.uiPages.find(_.id == pageId)

  def insert(row: UiPageRow): UiPageRow = {
    InMemoryStore.uiPages = InMemoryStore.uiPages :+ row
    row
  }

  def update(row: UiPageRow): Option[UiPageRow] =
    InMemoryStore.uiPages.indexWhere(_.id == row.id) match {
      case -1 => None
      case index =>
        InMemoryStore.uiPages = InMemoryStore.uiPages.updated(index, row)
        Some(row)
    }

  def deleteById(pageId: String): Option[UiPageRow] =
    InMemoryStore.uiPages.indexWhere(_.id == pageId) match {
      case -1 => None
      case index =>
        val deleted = InMemoryStore.uiPages(index)
        InMemoryStore.uiPages = InMemoryStore.uiPages.patch(index, Nil, 1)
        Some(deleted)
    }

  def addComponent(pageId: String, component: PageComponent, updatedAt: String): Option[UiPageRow] =
    findById(pageId).filterNot(_.components.exists(_.id == component.id)).flatMap { row =>
      update(row.copy(components = row.components :+ component, updatedAt = updatedAt))
    }

  def updateComponent(pageId: String, componentId: String, component: PageComponent, updatedAt: String): Option[UiPageRow] =
    findById(pageId).filter(_.components.exists(_.id == componentId)).flatMap { row =>
      update(row.copy(
        components = row.components.map(existing => if (existing.id == componentId) component else existing),
        updatedAt = updatedAt
      ))
    }

  def deleteComponent(pageId: String, componentId: String, updatedAt: String): Option[UiPageRow] =
    findById(pageId).filter(_.components.exists(_.id == componentId)).flatMap { row =>
      update(row.copy(
        components = row.components.filterNot(_.id == componentId),
        updatedAt = updatedAt
      ))
    }
}
