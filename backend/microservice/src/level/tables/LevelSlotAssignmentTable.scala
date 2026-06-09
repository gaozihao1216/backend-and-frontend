package microservice.level.tables

import java.sql.Connection

object LevelSlotAssignmentTable {
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) LevelSlotAssignmentTableJdbcSchema.initialize(connection)

  def listAll(connection: Connection): Vector[LevelSlotAssignmentRow] =
    if (isInMemory(connection)) LevelSlotAssignmentTableInMemory.listAll()
    else LevelSlotAssignmentTableJdbcRead.listAll(connection)

  def findBySuffix(connection: Connection, levelSuffix: String): Option[LevelSlotAssignmentRow] =
    if (isInMemory(connection)) LevelSlotAssignmentTableInMemory.findBySuffix(levelSuffix)
    else LevelSlotAssignmentTableJdbcRead.findBySuffix(connection, levelSuffix)

  def nextId(connection: Connection): String =
    if (isInMemory(connection)) LevelSlotAssignmentTableInMemory.nextId()
    else LevelSlotAssignmentTableJdbcRead.nextId(connection)

  def upsert(connection: Connection, row: LevelSlotAssignmentRow): LevelSlotAssignmentRow =
    if (isInMemory(connection)) LevelSlotAssignmentTableInMemory.upsert(row)
    else LevelSlotAssignmentTableJdbcWrite.upsert(connection, row)

  def deleteBySuffix(connection: Connection, levelSuffix: String): Boolean =
    if (isInMemory(connection)) LevelSlotAssignmentTableInMemory.deleteBySuffix(levelSuffix)
    else LevelSlotAssignmentTableJdbcWrite.deleteBySuffix(connection, levelSuffix)

  def deleteBySubmissionId(connection: Connection, submissionId: String): Boolean =
    if (isInMemory(connection)) LevelSlotAssignmentTableInMemory.deleteBySubmissionId(submissionId)
    else LevelSlotAssignmentTableJdbcWrite.deleteBySubmissionId(connection, submissionId)
}
