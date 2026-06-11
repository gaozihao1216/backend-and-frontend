package microservice.level.tables.slot_assignment

import microservice.level.tables.shared.LevelSlotAssignmentRow

import microservice.level.tables.slot_assignment.inmemory._
import microservice.level.tables.slot_assignment.jdbc._

import java.sql.Connection

/** 关卡槽位分配表访问门面：Director 将已批准投稿绑定到官方关卡槽位后缀。
  *
  * 实现：isInMemory(connection) 为 true 时走 LevelSlotAssignmentTableInMemory；否则走 JDBC 读写层。
  * 关联：admin AssignLevelSlot/UnassignLevelSlot/UpdateLevelSlotBirdPool APIMessage。
  */
object LevelSlotAssignmentTable {
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  /** JDBC 启动时建表；in-memory 模式下无需 DDL。 */
  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) LevelSlotAssignmentTableJdbcSchema.initialize(connection)

  /** 列出全部槽位分配记录（Director 看板用）。 */
  def listAll(connection: Connection): Vector[LevelSlotAssignmentRow] =
    if (isInMemory(connection)) LevelSlotAssignmentTableInMemory.listAll()
    else LevelSlotAssignmentTableJdbcRead.listAll(connection)

  /** 按关卡后缀（如 "1-1"）查找槽位分配。 */
  def findBySuffix(connection: Connection, levelSuffix: String): Option[LevelSlotAssignmentRow] =
    if (isInMemory(connection)) LevelSlotAssignmentTableInMemory.findBySuffix(levelSuffix)
    else LevelSlotAssignmentTableJdbcRead.findBySuffix(connection, levelSuffix)

  /** 生成下一个槽位分配 ID。 */
  def nextId(connection: Connection): String =
    if (isInMemory(connection)) LevelSlotAssignmentTableInMemory.nextId()
    else LevelSlotAssignmentTableJdbcRead.nextId(connection)

  /** 插入或更新槽位分配（按 suffix 唯一）。 */
  def upsert(connection: Connection, row: LevelSlotAssignmentRow): LevelSlotAssignmentRow =
    if (isInMemory(connection)) LevelSlotAssignmentTableInMemory.upsert(row)
    else LevelSlotAssignmentTableJdbcWrite.upsert(connection, row)

  /** 按关卡后缀删除槽位分配。 */
  def deleteBySuffix(connection: Connection, levelSuffix: String): Boolean =
    if (isInMemory(connection)) LevelSlotAssignmentTableInMemory.deleteBySuffix(levelSuffix)
    else LevelSlotAssignmentTableJdbcWrite.deleteBySuffix(connection, levelSuffix)

  /** 按投稿 ID 删除关联的槽位分配（投稿废止时清理）。 */
  def deleteBySubmissionId(connection: Connection, submissionId: String): Boolean =
    if (isInMemory(connection)) LevelSlotAssignmentTableInMemory.deleteBySubmissionId(submissionId)
    else LevelSlotAssignmentTableJdbcWrite.deleteBySubmissionId(connection, submissionId)
}
