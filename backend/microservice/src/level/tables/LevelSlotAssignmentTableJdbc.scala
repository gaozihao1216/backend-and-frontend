package microservice.level.tables

import java.sql.Connection

private[tables] object LevelSlotAssignmentTableJdbc {
  def initialize(connection: Connection): Unit =
    LevelSlotAssignmentTableJdbcSchema.initialize(connection)

  def listAll(connection: Connection): Vector[LevelSlotAssignmentRow] =
    LevelSlotAssignmentTableJdbcRead.listAll(connection)

  def findBySuffix(connection: Connection, levelSuffix: String): Option[LevelSlotAssignmentRow] =
    LevelSlotAssignmentTableJdbcRead.findBySuffix(connection, levelSuffix)

  def nextId(connection: Connection): String =
    LevelSlotAssignmentTableJdbcRead.nextId(connection)

  def upsert(connection: Connection, row: LevelSlotAssignmentRow): LevelSlotAssignmentRow =
    LevelSlotAssignmentTableJdbcWrite.upsert(connection, row)

  def deleteBySuffix(connection: Connection, levelSuffix: String): Boolean =
    LevelSlotAssignmentTableJdbcWrite.deleteBySuffix(connection, levelSuffix)

  def deleteBySubmissionId(connection: Connection, submissionId: String): Boolean =
    LevelSlotAssignmentTableJdbcWrite.deleteBySubmissionId(connection, submissionId)
}
