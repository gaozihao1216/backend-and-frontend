package microservice.ui.tables.button_template

import microservice.ui.tables.button_template.inmemory._
import microservice.ui.tables.button_template.jdbc._

import java.sql.Connection

object ButtonTemplateTable {
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) ButtonTemplateTableJdbcSchema.initialize(connection)

  def listAll(connection: Connection): Vector[ButtonTemplateRow] =
    if (isInMemory(connection)) ButtonTemplateTableInMemory.listAll()
    else ButtonTemplateTableJdbcRead.listAll(connection)

  def findById(connection: Connection, templateId: String): Option[ButtonTemplateRow] =
    if (isInMemory(connection)) ButtonTemplateTableInMemory.findById(templateId)
    else ButtonTemplateTableJdbcRead.findById(connection, templateId)

  def insert(connection: Connection, row: ButtonTemplateRow): ButtonTemplateRow =
    if (isInMemory(connection)) ButtonTemplateTableInMemory.insert(row)
    else ButtonTemplateTableJdbcWrite.insert(connection, row)

  def update(connection: Connection, row: ButtonTemplateRow): Option[ButtonTemplateRow] =
    if (isInMemory(connection)) ButtonTemplateTableInMemory.update(row)
    else ButtonTemplateTableJdbcWrite.update(connection, row)

  def deleteById(connection: Connection, templateId: String): Option[ButtonTemplateRow] =
    if (isInMemory(connection)) ButtonTemplateTableInMemory.deleteById(templateId)
    else ButtonTemplateTableJdbcWrite.deleteById(connection, templateId)
}
