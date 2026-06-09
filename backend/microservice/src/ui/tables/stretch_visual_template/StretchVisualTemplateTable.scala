package microservice.ui.tables.stretch_visual_template

import microservice.ui.tables.stretch_visual_template.inmemory._
import microservice.ui.tables.stretch_visual_template.jdbc._

import java.sql.Connection
import microservice.ui.objects.StretchVisualTemplateKind

object StretchVisualTemplateTable {
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) StretchVisualTemplateTableJdbcSchema.initialize(connection)

  def listByKind(connection: Connection, kind: StretchVisualTemplateKind): Vector[StretchVisualTemplateRow] =
    if (isInMemory(connection)) StretchVisualTemplateTableInMemory.listByKind(kind)
    else StretchVisualTemplateTableJdbcRead.listByKind(connection, kind)

  def findById(connection: Connection, templateId: String): Option[StretchVisualTemplateRow] =
    if (isInMemory(connection)) StretchVisualTemplateTableInMemory.findById(templateId)
    else StretchVisualTemplateTableJdbcRead.findById(connection, templateId)

  def insert(connection: Connection, row: StretchVisualTemplateRow): StretchVisualTemplateRow =
    if (isInMemory(connection)) StretchVisualTemplateTableInMemory.insert(row)
    else StretchVisualTemplateTableJdbcWrite.insert(connection, row)

  def update(connection: Connection, row: StretchVisualTemplateRow): Option[StretchVisualTemplateRow] =
    if (isInMemory(connection)) StretchVisualTemplateTableInMemory.update(row)
    else StretchVisualTemplateTableJdbcWrite.update(connection, row)

  def deleteById(connection: Connection, templateId: String): Option[StretchVisualTemplateRow] =
    if (isInMemory(connection)) StretchVisualTemplateTableInMemory.deleteById(templateId)
    else StretchVisualTemplateTableJdbcWrite.deleteById(connection, templateId)
}
