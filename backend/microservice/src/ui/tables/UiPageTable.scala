package microservice.ui.tables

import java.sql.Connection
import microservice.ui.objects.{PageComponent, UiEndpoint}

object UiPageTable {
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) UiPageTableJdbc.initialize(connection)

  def listAll(connection: Connection): Vector[UiPageRow] =
    if (isInMemory(connection)) UiPageTableInMemory.listAll()
    else UiPageTableJdbc.listAll(connection)

  def listByEndpoint(connection: Connection, endpoint: UiEndpoint): Vector[UiPageRow] =
    if (isInMemory(connection)) UiPageTableInMemory.listByEndpoint(endpoint)
    else UiPageTableJdbc.listByEndpoint(connection, endpoint)

  def findById(connection: Connection, pageId: String): Option[UiPageRow] =
    if (isInMemory(connection)) UiPageTableInMemory.findById(pageId)
    else UiPageTableJdbc.findById(connection, pageId)

  def insert(connection: Connection, row: UiPageRow): UiPageRow =
    if (isInMemory(connection)) UiPageTableInMemory.insert(row)
    else UiPageTableJdbc.insert(connection, row)

  def update(connection: Connection, row: UiPageRow): Option[UiPageRow] =
    if (isInMemory(connection)) UiPageTableInMemory.update(row)
    else UiPageTableJdbc.update(connection, row)

  def deleteById(connection: Connection, pageId: String): Option[UiPageRow] =
    if (isInMemory(connection)) UiPageTableInMemory.deleteById(pageId)
    else UiPageTableJdbc.deleteById(connection, pageId)

  def addComponent(connection: Connection, pageId: String, component: PageComponent, updatedAt: String): Option[UiPageRow] =
    if (isInMemory(connection)) UiPageTableInMemory.addComponent(pageId, component, updatedAt)
    else UiPageTableJdbc.addComponent(connection, pageId, component, updatedAt)

  def updateComponent(connection: Connection, pageId: String, componentId: String, component: PageComponent, updatedAt: String): Option[UiPageRow] =
    if (isInMemory(connection)) UiPageTableInMemory.updateComponent(pageId, componentId, component, updatedAt)
    else UiPageTableJdbc.updateComponent(connection, pageId, componentId, component, updatedAt)

  def deleteComponent(connection: Connection, pageId: String, componentId: String, updatedAt: String): Option[UiPageRow] =
    if (isInMemory(connection)) UiPageTableInMemory.deleteComponent(pageId, componentId, updatedAt)
    else UiPageTableJdbc.deleteComponent(connection, pageId, componentId, updatedAt)
}
