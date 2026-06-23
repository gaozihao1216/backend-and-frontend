package microservice.level.tables.submission

import java.sql.Connection
import microservice.infrastructure.database.{InMemoryStore, TableConnection}
import microservice.level.tables.shared.SubmissionRow
import microservice.level.tables.submission.jdbc.SubmissionTableJdbc
import microservice.system.objects.SubmissionStatus

/** 关卡投稿表访问门面：根据 connection 是否为 null 在 in-memory 与 JDBC 实现间分流。
  *
  * 实现：TableConnection.isInMemory(connection) 为 true 时直接读写 InMemoryStore；否则走 SubmissionTableJdbc。
  * 关联：SubmitLevelAPIMessage 写入；admin ReviewSubmissionAPIMessage 审核更新。
  */
private[level] object SubmissionTable {
  /** JDBC 启动时建表；in-memory 模式下无需 DDL。 */
  def initialize(connection: Connection): Unit =
    if (!TableConnection.isInMemory(connection)) SubmissionTableJdbc.initialize(connection)

  /** 列出所有待审核（PendingReview）投稿。 */
  def listPending(connection: Connection): Vector[SubmissionRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.submissions.filter(_.status == SubmissionStatus.PendingReview)
    } else {
      SubmissionTableJdbc.listPending(connection)
    }

  /** 列出所有已批准（Approved）投稿。 */
  def listApproved(connection: Connection): Vector[SubmissionRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.submissions.filter(_.status == SubmissionStatus.Approved)
    } else {
      SubmissionTableJdbc.listApproved(connection)
    }

  /** 检查指定关卡是否已有 pending 投稿（防止重复提交）。 */
  def hasPendingForLevel(connection: Connection, levelId: String): Boolean =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.submissions.exists(submission =>
        submission.levelId == levelId && submission.status == SubmissionStatus.PendingReview
      )
    } else {
      SubmissionTableJdbc.hasPendingForLevel(connection, levelId)
    }

  /** 生成下一个投稿 ID。 */
  def nextId(connection: Connection): String =
    if (TableConnection.isInMemory(connection)) {
      s"submission-${InMemoryStore.submissions.size + 1}"
    } else {
      SubmissionTableJdbc.nextId(connection)
    }

  /** 插入新投稿记录。 */
  def insert(connection: Connection, row: SubmissionRow): SubmissionRow =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.submissions = InMemoryStore.submissions :+ row
      row
    } else {
      SubmissionTableJdbc.insert(connection, row)
    }

  /** 按 ID 查找投稿。 */
  def findById(connection: Connection, submissionId: String): Option[SubmissionRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.submissions.find(_.id == submissionId)
    } else {
      SubmissionTableJdbc.findById(connection, submissionId)
    }

  /** 更新审核结果：状态、审核人、备注与审核时间。 */
  def updateReview(
    connection: Connection,
    submissionId: String,
    status: SubmissionStatus,
    reviewerId: String,
    reviewNote: Option[String],
    reviewedAt: String
  ): Option[SubmissionRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.submissions.indexWhere(_.id == submissionId) match {
        case -1 => None
        case index =>
          val updated = InMemoryStore.submissions(index).copy(
            status = status,
            reviewerId = Some(reviewerId),
            reviewNote = reviewNote,
            reviewedAt = Some(reviewedAt)
          )
          InMemoryStore.submissions = InMemoryStore.submissions.updated(index, updated)
          Some(updated)
      }
    } else {
      SubmissionTableJdbc.updateReview(connection, submissionId, status, reviewerId, reviewNote, reviewedAt)
    }
}
