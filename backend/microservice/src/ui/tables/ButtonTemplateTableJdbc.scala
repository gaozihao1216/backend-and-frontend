package microservice.ui.tables

import java.sql.Connection

private[tables] object ButtonTemplateTableJdbc {
  def initialize(connection: Connection): Unit =
    ButtonTemplateTableJdbcSchema.initialize(connection)

  def listAll(connection: Connection): Vector[ButtonTemplateRow] =
    ButtonTemplateTableJdbcRead.listAll(connection)

  def findById(connection: Connection, templateId: String): Option[ButtonTemplateRow] =
    ButtonTemplateTableJdbcRead.findById(connection, templateId)

  def insert(connection: Connection, row: ButtonTemplateRow): ButtonTemplateRow =
    ButtonTemplateTableJdbcWrite.insert(connection, row)

  def update(connection: Connection, row: ButtonTemplateRow): Option[ButtonTemplateRow] =
    ButtonTemplateTableJdbcWrite.update(connection, row)

  def deleteById(connection: Connection, templateId: String): Option[ButtonTemplateRow] =
    ButtonTemplateTableJdbcWrite.deleteById(connection, templateId)
}
