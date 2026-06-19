/** InMemoryStore 上的 关卡槽位 CRUD；演示模式与单元测试使用。
  *
  * 关联：关卡模块 Table 门面在 connection == null 时委托到此实现。
  */
package microservice.level.tables.slot_assignment.inmemory

/** LevelSlotAssignmentTableInMemory 表访问门面。
  *
  * 表职责：封装 levelslotassignmentinmemory 数据的 CRUD。
  * Row↔Object 映射：通过 RowMapper/Codec 与领域对象互转。
  * inmemory/jdbc 双实现：connection == null 走 InMemoryStore，否则走 JDBC SQL。
  */
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
