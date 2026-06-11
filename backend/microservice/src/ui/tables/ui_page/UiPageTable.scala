package microservice.ui.tables.ui_page

import microservice.ui.tables.ui_page.inmemory._
import microservice.ui.tables.ui_page.jdbc._

import java.sql.Connection
import microservice.ui.objects.{PageComponent, UiEndpoint}

/** UI 页面配置表访问门面：PageConfig 的 CRUD 与页面内组件的增删改。
  *
  * 组件以 JSON 嵌入页面行；总监通过 UiCustomizationRouter 管理，玩家通过 GetSharedLevelMapPage 读取。
  */
object UiPageTable {
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  /** 启动时建表；仅 JDBC 模式执行 DDL。 */
  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) UiPageTableJdbcSchema.initialize(connection)

  /** 返回全部页面配置行。 */
  def listAll(connection: Connection): Vector[UiPageRow] =
    if (isInMemory(connection)) UiPageTableInMemory.listAll()
    else UiPageTableJdbcRead.listAll(connection)

  /** 按角色端点（player/designer 等）过滤页面列表。 */
  def listByEndpoint(connection: Connection, endpoint: UiEndpoint): Vector[UiPageRow] =
    if (isInMemory(connection)) UiPageTableInMemory.listByEndpoint(endpoint)
    else UiPageTableJdbcRead.listByEndpoint(connection, endpoint)

  /** 按 pageId 查找单页配置。 */
  def findById(connection: Connection, pageId: String): Option[UiPageRow] =
    if (isInMemory(connection)) UiPageTableInMemory.findById(pageId)
    else UiPageTableJdbcRead.findById(connection, pageId)

  /** 插入新页面配置。 */
  def insert(connection: Connection, row: UiPageRow): UiPageRow =
    if (isInMemory(connection)) UiPageTableInMemory.insert(row)
    else UiPageTableJdbcWrite.insert(connection, row)

  /** 更新已有页面配置；不存在时返回 None。 */
  def update(connection: Connection, row: UiPageRow): Option[UiPageRow] =
    if (isInMemory(connection)) UiPageTableInMemory.update(row)
    else UiPageTableJdbcWrite.update(connection, row)

  /** 按 pageId 删除页面并返回被删行。 */
  def deleteById(connection: Connection, pageId: String): Option[UiPageRow] =
    if (isInMemory(connection)) UiPageTableInMemory.deleteById(pageId)
    else UiPageTableJdbcWrite.deleteById(connection, pageId)

  /** 向页面追加一个组件并更新 updatedAt。 */
  def addComponent(connection: Connection, pageId: String, component: PageComponent, updatedAt: String): Option[UiPageRow] =
    if (isInMemory(connection)) UiPageTableInMemory.addComponent(pageId, component, updatedAt)
    else UiPageTableJdbcWrite.addComponent(connection, pageId, component, updatedAt)

  /** 更新页面内指定组件。 */
  def updateComponent(connection: Connection, pageId: String, componentId: String, component: PageComponent, updatedAt: String): Option[UiPageRow] =
    if (isInMemory(connection)) UiPageTableInMemory.updateComponent(pageId, componentId, component, updatedAt)
    else UiPageTableJdbcWrite.updateComponent(connection, pageId, componentId, component, updatedAt)

  /** 从页面中删除指定组件。 */
  def deleteComponent(connection: Connection, pageId: String, componentId: String, updatedAt: String): Option[UiPageRow] =
    if (isInMemory(connection)) UiPageTableInMemory.deleteComponent(pageId, componentId, updatedAt)
    else UiPageTableJdbcWrite.deleteComponent(connection, pageId, componentId, updatedAt)
}
