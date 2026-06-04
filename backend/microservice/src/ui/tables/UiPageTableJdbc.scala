package microservice.ui.tables

import java.sql.Connection
import microservice.ui.objects.{PageComponent, UiEndpoint}

private[tables] object UiPageTableJdbc {
  def initialize(connection: Connection): Unit =
    UiPageTableJdbcSchema.initialize(connection)

  def listAll(connection: Connection): Vector[UiPageRow] =
    UiPageTableJdbcRead.listAll(connection)

  def listByEndpoint(connection: Connection, endpoint: UiEndpoint): Vector[UiPageRow] =
    UiPageTableJdbcRead.listByEndpoint(connection, endpoint)

  def findById(connection: Connection, pageId: String): Option[UiPageRow] =
    UiPageTableJdbcRead.findById(connection, pageId)

  def insert(connection: Connection, row: UiPageRow): UiPageRow =
    UiPageTableJdbcWrite.insert(connection, row)

  def update(connection: Connection, row: UiPageRow): Option[UiPageRow] =
    UiPageTableJdbcWrite.update(connection, row)

  def deleteById(connection: Connection, pageId: String): Option[UiPageRow] =
    UiPageTableJdbcWrite.deleteById(connection, pageId)

  def addComponent(connection: Connection, pageId: String, component: PageComponent, updatedAt: String): Option[UiPageRow] =
    UiPageTableJdbcWrite.addComponent(connection, pageId, component, updatedAt)

  def updateComponent(connection: Connection, pageId: String, componentId: String, component: PageComponent, updatedAt: String): Option[UiPageRow] =
    UiPageTableJdbcWrite.updateComponent(connection, pageId, componentId, component, updatedAt)

  def deleteComponent(connection: Connection, pageId: String, componentId: String, updatedAt: String): Option[UiPageRow] =
    UiPageTableJdbcWrite.deleteComponent(connection, pageId, componentId, updatedAt)
}
