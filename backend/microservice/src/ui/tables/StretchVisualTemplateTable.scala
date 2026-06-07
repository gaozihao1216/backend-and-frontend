package microservice.ui.tables

import java.sql.Connection
import microservice.ui.objects.StretchVisualTemplateKind

object StretchVisualTemplateTable {
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) StretchVisualTemplateTableJdbc.initialize(connection)

  def listByKind(connection: Connection, kind: StretchVisualTemplateKind): Vector[StretchVisualTemplateRow] =
    if (isInMemory(connection)) StretchVisualTemplateTableInMemory.listByKind(kind)
    else StretchVisualTemplateTableJdbc.listByKind(connection, kind)

  def findById(connection: Connection, templateId: String): Option[StretchVisualTemplateRow] =
    if (isInMemory(connection)) StretchVisualTemplateTableInMemory.findById(templateId)
    else StretchVisualTemplateTableJdbc.findById(connection, templateId)

  def insert(connection: Connection, row: StretchVisualTemplateRow): StretchVisualTemplateRow =
    if (isInMemory(connection)) StretchVisualTemplateTableInMemory.insert(row)
    else StretchVisualTemplateTableJdbc.insert(connection, row)

  def update(connection: Connection, row: StretchVisualTemplateRow): Option[StretchVisualTemplateRow] =
    if (isInMemory(connection)) StretchVisualTemplateTableInMemory.update(row)
    else StretchVisualTemplateTableJdbc.update(connection, row)

  def deleteById(connection: Connection, templateId: String): Option[StretchVisualTemplateRow] =
    if (isInMemory(connection)) StretchVisualTemplateTableInMemory.deleteById(templateId)
    else StretchVisualTemplateTableJdbc.deleteById(connection, templateId)
}
