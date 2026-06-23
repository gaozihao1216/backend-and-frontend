package microservice.level.tables.slot_assignment

import java.sql.Connection
import microservice.infrastructure.database.{InMemoryStore, TableConnection}
import microservice.level.tables.shared.LevelSlotAssignmentRow
import microservice.level.tables.slot_assignment.jdbc.LevelSlotAssignmentTableJdbc

/** 关卡槽位分配表访问门面：Director 将已批准投稿绑定到官方关卡槽位后缀。
  *
  * 实现：TableConnection.isInMemory(connection) 为 true 时直接读写 InMemoryStore；否则走 LevelSlotAssignmentTableJdbc。
  * 关联：admin AssignLevelSlot/UnassignLevelSlot/UpdateLevelSlotBirdPool APIMessage。
  */
object LevelSlotAssignmentTable {
  /** JDBC 启动时建表；in-memory 模式下无需 DDL。 */
  def initialize(connection: Connection): Unit =
    if (!TableConnection.isInMemory(connection)) LevelSlotAssignmentTableJdbc.initialize(connection)

  /** 列出全部槽位分配记录（Director 看板用）。 */
  def listAll(connection: Connection): Vector[LevelSlotAssignmentRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.levelSlotAssignments.sortBy(_.levelSuffix)
    } else {
      LevelSlotAssignmentTableJdbc.listAll(connection)
    }

  /** 按关卡后缀（如 "1-1"）查找槽位分配。 */
  def findBySuffix(connection: Connection, levelSuffix: String): Option[LevelSlotAssignmentRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.levelSlotAssignments.find(_.levelSuffix == levelSuffix)
    } else {
      LevelSlotAssignmentTableJdbc.findBySuffix(connection, levelSuffix)
    }

  /** 生成下一个槽位分配 ID。 */
  def nextId(connection: Connection): String =
    if (TableConnection.isInMemory(connection)) {
      s"level-slot-assignment-${InMemoryStore.levelSlotAssignments.size + 1}"
    } else {
      LevelSlotAssignmentTableJdbc.nextId(connection)
    }

  /** 插入或更新槽位分配（按 suffix 唯一）。 */
  def upsert(connection: Connection, row: LevelSlotAssignmentRow): LevelSlotAssignmentRow =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.levelSlotAssignments =
        InMemoryStore.levelSlotAssignments.filterNot(existing =>
          existing.levelSuffix == row.levelSuffix || existing.submissionId == row.submissionId
        ) :+ row
      row
    } else {
      LevelSlotAssignmentTableJdbc.upsert(connection, row)
    }

  /** 按关卡后缀删除槽位分配。 */
  def deleteBySuffix(connection: Connection, levelSuffix: String): Boolean =
    if (TableConnection.isInMemory(connection)) {
      val before = InMemoryStore.levelSlotAssignments.size
      InMemoryStore.levelSlotAssignments =
        InMemoryStore.levelSlotAssignments.filterNot(_.levelSuffix == levelSuffix)
      InMemoryStore.levelSlotAssignments.size != before
    } else {
      LevelSlotAssignmentTableJdbc.deleteBySuffix(connection, levelSuffix)
    }

  /** 按投稿 ID 删除关联的槽位分配（投稿废止时清理）。 */
  def deleteBySubmissionId(connection: Connection, submissionId: String): Boolean =
    if (TableConnection.isInMemory(connection)) {
      val before = InMemoryStore.levelSlotAssignments.size
      InMemoryStore.levelSlotAssignments =
        InMemoryStore.levelSlotAssignments.filterNot(_.submissionId == submissionId)
      InMemoryStore.levelSlotAssignments.size != before
    } else {
      LevelSlotAssignmentTableJdbc.deleteBySubmissionId(connection, submissionId)
    }
}
