package microservice.level.tables.submission

import microservice.level.tables.shared.SubmissionRow

import microservice.level.tables.submission.inmemory._
import microservice.level.tables.submission.jdbc._

import microservice.system.objects.SubmissionStatus
import java.sql.Connection

/** 关卡投稿表访问门面：根据 connection 是否为 null 在 in-memory 与 JDBC 实现间分流。
  *
  * 实现：isInMemory(connection) 为 true 时走 SubmissionTableInMemory；否则走 JDBC 读写层。
  * 关联：SubmitLevelAPIMessage 写入；admin ReviewSubmissionAPIMessage 审核更新。
  */
object SubmissionTable {
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  /** JDBC 启动时建表；in-memory 模式下无需 DDL。 */
  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) SubmissionTableJdbcSchema.initialize(connection)

  /** 列出所有待审核（PendingReview）投稿。 */
  def listPending(connection: Connection): Vector[SubmissionRow] =
    if (isInMemory(connection)) SubmissionTableInMemory.listPending()
    else SubmissionTableJdbcRead.listPending(connection)

  /** 列出所有已批准（Approved）投稿。 */
  def listApproved(connection: Connection): Vector[SubmissionRow] =
    if (isInMemory(connection)) SubmissionTableInMemory.listApproved()
    else SubmissionTableJdbcRead.listApproved(connection)

  /** 检查指定关卡是否已有 pending 投稿（防止重复提交）。 */
  def hasPendingForLevel(connection: Connection, levelId: String): Boolean =
    if (isInMemory(connection)) SubmissionTableInMemory.hasPendingForLevel(levelId)
    else SubmissionTableJdbcRead.hasPendingForLevel(connection, levelId)

  /** 生成下一个投稿 ID。 */
  def nextId(connection: Connection): String =
    if (isInMemory(connection)) SubmissionTableInMemory.nextId()
    else SubmissionTableJdbcRead.nextId(connection)

  /** 插入新投稿记录。 */
  def insert(connection: Connection, row: SubmissionRow): SubmissionRow =
    if (isInMemory(connection)) SubmissionTableInMemory.insert(row)
    else SubmissionTableJdbcWrite.insert(connection, row)

  /** 按 ID 查找投稿。 */
  def findById(connection: Connection, submissionId: String): Option[SubmissionRow] =
    if (isInMemory(connection)) SubmissionTableInMemory.findById(submissionId)
    else SubmissionTableJdbcRead.findById(connection, submissionId)

  /** 更新审核结果：状态、审核人、备注与审核时间。 */
  def updateReview(
    connection: Connection,
    submissionId: String,
    status: SubmissionStatus,
    reviewerId: String,
    reviewNote: Option[String],
    reviewedAt: String
  ): Option[SubmissionRow] =
    if (isInMemory(connection)) SubmissionTableInMemory.updateReview(submissionId, status, reviewerId, reviewNote, reviewedAt)
    else SubmissionTableJdbcWrite.updateReview(connection, submissionId, status, reviewerId, reviewNote, reviewedAt)
}
