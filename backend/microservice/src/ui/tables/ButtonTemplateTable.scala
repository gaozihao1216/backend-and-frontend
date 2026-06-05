package microservice.ui.tables

import java.sql.Connection

object ButtonTemplateTable {
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) ButtonTemplateTableJdbc.initialize(connection)

  def listAll(connection: Connection): Vector[ButtonTemplateRow] =
    if (isInMemory(connection)) ButtonTemplateTableInMemory.listAll()
    else ButtonTemplateTableJdbc.listAll(connection)

  def findById(connection: Connection, templateId: String): Option[ButtonTemplateRow] =
    if (isInMemory(connection)) ButtonTemplateTableInMemory.findById(templateId)
    else ButtonTemplateTableJdbc.findById(connection, templateId)

  def insert(connection: Connection, row: ButtonTemplateRow): ButtonTemplateRow =
    if (isInMemory(connection)) ButtonTemplateTableInMemory.insert(row)
    else ButtonTemplateTableJdbc.insert(connection, row)

  def update(connection: Connection, row: ButtonTemplateRow): Option[ButtonTemplateRow] =
    if (isInMemory(connection)) ButtonTemplateTableInMemory.update(row)
    else ButtonTemplateTableJdbc.update(connection, row)

  def deleteById(connection: Connection, templateId: String): Option[ButtonTemplateRow] =
    if (isInMemory(connection)) ButtonTemplateTableInMemory.deleteById(templateId)
    else ButtonTemplateTableJdbc.deleteById(connection, templateId)
}
