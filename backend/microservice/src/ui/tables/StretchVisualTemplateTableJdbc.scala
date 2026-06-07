package microservice.ui.tables

import java.sql.Connection

private[tables] object StretchVisualTemplateTableJdbc {
  def initialize(connection: Connection): Unit =
    StretchVisualTemplateTableJdbcSchema.initialize(connection)

  def listByKind(connection: Connection, kind: microservice.ui.objects.StretchVisualTemplateKind): Vector[StretchVisualTemplateRow] =
    StretchVisualTemplateTableJdbcRead.listByKind(connection, kind)

  def findById(connection: Connection, templateId: String): Option[StretchVisualTemplateRow] =
    StretchVisualTemplateTableJdbcRead.findById(connection, templateId)

  def insert(connection: Connection, row: StretchVisualTemplateRow): StretchVisualTemplateRow =
    StretchVisualTemplateTableJdbcWrite.insert(connection, row)

  def update(connection: Connection, row: StretchVisualTemplateRow): Option[StretchVisualTemplateRow] =
    StretchVisualTemplateTableJdbcWrite.update(connection, row)

  def deleteById(connection: Connection, templateId: String): Option[StretchVisualTemplateRow] =
    StretchVisualTemplateTableJdbcWrite.deleteById(connection, templateId)
}
