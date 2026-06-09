package microservice.level.tables.slot_assignment.inmemory

import microservice.level.tables.shared.LevelSlotAssignmentRow

import microservice.level.tables.slot_assignment._

import microservice.infrastructure.database.InMemoryStore

private[tables] object LevelSlotAssignmentTableInMemory {
  def listAll(): Vector[LevelSlotAssignmentRow] =
    InMemoryStore.levelSlotAssignments.sortBy(_.levelSuffix)

  def findBySuffix(levelSuffix: String): Option[LevelSlotAssignmentRow] =
    InMemoryStore.levelSlotAssignments.find(_.levelSuffix == levelSuffix)

  def nextId(): String =
    s"level-slot-assignment-${InMemoryStore.levelSlotAssignments.size + 1}"

  def upsert(row: LevelSlotAssignmentRow): LevelSlotAssignmentRow = {
    InMemoryStore.levelSlotAssignments =
      InMemoryStore.levelSlotAssignments.filterNot(existing =>
        existing.levelSuffix == row.levelSuffix || existing.submissionId == row.submissionId
      ) :+ row
    row
  }

  def deleteBySuffix(levelSuffix: String): Boolean = {
    val before = InMemoryStore.levelSlotAssignments.size
    InMemoryStore.levelSlotAssignments =
      InMemoryStore.levelSlotAssignments.filterNot(_.levelSuffix == levelSuffix)
    InMemoryStore.levelSlotAssignments.size != before
  }

  def deleteBySubmissionId(submissionId: String): Boolean = {
    val before = InMemoryStore.levelSlotAssignments.size
    InMemoryStore.levelSlotAssignments =
      InMemoryStore.levelSlotAssignments.filterNot(_.submissionId == submissionId)
    InMemoryStore.levelSlotAssignments.size != before
  }
}
