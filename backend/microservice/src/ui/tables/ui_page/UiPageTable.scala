package microservice.ui.tables.ui_page

import java.sql.Connection
import microservice.infrastructure.database.{InMemoryStore, TableConnection}
import microservice.ui.objects.component.PageComponent
import microservice.ui.objects.UiEndpoint
import microservice.ui.tables.ui_page.jdbc.UiPageTableJdbc

/** UI 页面配置表访问门面：PageConfig 的 CRUD 与页面内组件的增删改。
  *
  * 组件以 JSON 嵌入页面行；总监通过 UiCustomizationRouter 管理，玩家通过 GetSharedLevelMapPage 读取。
  */
object UiPageTable {
  /** 启动时建表；仅 JDBC 模式执行 DDL。 */
  def initialize(connection: Connection): Unit =
    if (!TableConnection.isInMemory(connection)) UiPageTableJdbc.initialize(connection)

  /** 返回全部页面配置行。 */
  def listAll(connection: Connection): Vector[UiPageRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.uiPages.sortBy(_.id)
    } else {
      UiPageTableJdbc.listAll(connection)
    }

  /** 按角色端点（player/designer 等）过滤页面列表。 */
  def listByEndpoint(connection: Connection, endpoint: UiEndpoint): Vector[UiPageRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.uiPages.filter(_.roleScope == endpoint).sortBy(_.id)
    } else {
      UiPageTableJdbc.listByEndpoint(connection, endpoint)
    }

  /** 按 pageId 查找单页配置。 */
  def findById(connection: Connection, pageId: String): Option[UiPageRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.uiPages.find(_.id == pageId)
    } else {
      UiPageTableJdbc.findById(connection, pageId)
    }

  /** 插入新页面配置。 */
  def insert(connection: Connection, row: UiPageRow): UiPageRow =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.uiPages = InMemoryStore.uiPages :+ row
      row
    } else {
      UiPageTableJdbc.insert(connection, row)
    }

  /** 更新已有页面配置；不存在时返回 None。 */
  def update(connection: Connection, row: UiPageRow): Option[UiPageRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.uiPages.indexWhere(_.id == row.id) match {
        case -1 => None
        case index =>
          InMemoryStore.uiPages = InMemoryStore.uiPages.updated(index, row)
          Some(row)
      }
    } else {
      UiPageTableJdbc.update(connection, row)
    }

  /** 按 pageId 删除页面并返回被删行。 */
  def deleteById(connection: Connection, pageId: String): Option[UiPageRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.uiPages.indexWhere(_.id == pageId) match {
        case -1 => None
        case index =>
          val deleted = InMemoryStore.uiPages(index)
          InMemoryStore.uiPages = InMemoryStore.uiPages.patch(index, Nil, 1)
          Some(deleted)
      }
    } else {
      UiPageTableJdbc.deleteById(connection, pageId)
    }

  /** 向页面追加一个组件并更新 updatedAt。 */
  def addComponent(connection: Connection, pageId: String, component: PageComponent, updatedAt: String): Option[UiPageRow] =
    if (TableConnection.isInMemory(connection)) {
      findById(connection, pageId).filterNot(_.components.exists(_.id == component.id)).flatMap { row =>
        update(connection, row.copy(components = row.components :+ component, updatedAt = updatedAt))
      }
    } else {
      UiPageTableJdbc.addComponent(connection, pageId, component, updatedAt)
    }

  /** 更新页面内指定组件。 */
  def updateComponent(connection: Connection, pageId: String, componentId: String, component: PageComponent, updatedAt: String): Option[UiPageRow] =
    if (TableConnection.isInMemory(connection)) {
      findById(connection, pageId).filter(_.components.exists(_.id == componentId)).flatMap { row =>
        update(connection, row.copy(
          components = row.components.map(existing => if (existing.id == componentId) component else existing),
          updatedAt = updatedAt
        ))
      }
    } else {
      UiPageTableJdbc.updateComponent(connection, pageId, componentId, component, updatedAt)
    }

  /** 从页面中删除指定组件。 */
  def deleteComponent(connection: Connection, pageId: String, componentId: String, updatedAt: String): Option[UiPageRow] =
    if (TableConnection.isInMemory(connection)) {
      findById(connection, pageId).filter(_.components.exists(_.id == componentId)).flatMap { row =>
        update(connection, row.copy(
          components = row.components.filterNot(_.id == componentId),
          updatedAt = updatedAt
        ))
      }
    } else {
      UiPageTableJdbc.deleteComponent(connection, pageId, componentId, updatedAt)
    }
}
