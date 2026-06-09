package microservice.ui.tables.ui_page

import microservice.ui.tables.ui_page.inmemory._
import microservice.ui.tables.ui_page.jdbc._

import java.sql.Connection
import microservice.ui.objects.{PageComponent, UiEndpoint}

object UiPageTable {
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) UiPageTableJdbcSchema.initialize(connection)

  def listAll(connection: Connection): Vector[UiPageRow] =
    if (isInMemory(connection)) UiPageTableInMemory.listAll()
    else UiPageTableJdbcRead.listAll(connection)

  def listByEndpoint(connection: Connection, endpoint: UiEndpoint): Vector[UiPageRow] =
    if (isInMemory(connection)) UiPageTableInMemory.listByEndpoint(endpoint)
    else UiPageTableJdbcRead.listByEndpoint(connection, endpoint)

  def findById(connection: Connection, pageId: String): Option[UiPageRow] =
    if (isInMemory(connection)) UiPageTableInMemory.findById(pageId)
    else UiPageTableJdbcRead.findById(connection, pageId)

  def insert(connection: Connection, row: UiPageRow): UiPageRow =
    if (isInMemory(connection)) UiPageTableInMemory.insert(row)
    else UiPageTableJdbcWrite.insert(connection, row)

  def update(connection: Connection, row: UiPageRow): Option[UiPageRow] =
    if (isInMemory(connection)) UiPageTableInMemory.update(row)
    else UiPageTableJdbcWrite.update(connection, row)

  def deleteById(connection: Connection, pageId: String): Option[UiPageRow] =
    if (isInMemory(connection)) UiPageTableInMemory.deleteById(pageId)
    else UiPageTableJdbcWrite.deleteById(connection, pageId)

  def addComponent(connection: Connection, pageId: String, component: PageComponent, updatedAt: String): Option[UiPageRow] =
    if (isInMemory(connection)) UiPageTableInMemory.addComponent(pageId, component, updatedAt)
    else UiPageTableJdbcWrite.addComponent(connection, pageId, component, updatedAt)

  def updateComponent(connection: Connection, pageId: String, componentId: String, component: PageComponent, updatedAt: String): Option[UiPageRow] =
    if (isInMemory(connection)) UiPageTableInMemory.updateComponent(pageId, componentId, component, updatedAt)
    else UiPageTableJdbcWrite.updateComponent(connection, pageId, componentId, component, updatedAt)

  def deleteComponent(connection: Connection, pageId: String, componentId: String, updatedAt: String): Option[UiPageRow] =
    if (isInMemory(connection)) UiPageTableInMemory.deleteComponent(pageId, componentId, updatedAt)
    else UiPageTableJdbcWrite.deleteComponent(connection, pageId, componentId, updatedAt)
}
