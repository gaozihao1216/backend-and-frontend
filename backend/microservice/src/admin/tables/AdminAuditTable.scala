package microservice.admin.tables

import java.sql.Connection
import microservice.admin.tables.jdbc.AdminAuditTableJdbc
import microservice.infrastructure.database.{InMemoryStore, TableConnection}

/** 管理员审核审计表访问门面：append-only 记录关卡/鸟类审核与总监废止决策。
  *
  * 实现：connection == null 时走 InMemoryStore；否则走 PostgreSQL review_audits 表。
  * 关联：ReviewSubmissionAPIMessage、ReviewBirdSubmissionAPIMessage、AbolishDirectorSubmissionAPIMessage。
  */
object AdminAuditTable {
  /** JDBC 启动时建表；in-memory 模式下无需 DDL。 */
  def initialize(connection: Connection): Unit =
    if (!TableConnection.isInMemory(connection)) AdminAuditTableJdbc.initialize(connection)

  /** 列出全部审计记录（按 reviewedAt 降序）。 */
  def listAll(connection: Connection): Vector[ReviewAuditRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.reviewAudits.sortBy(_.reviewedAt)(Ordering[String].reverse)
    } else {
      AdminAuditTableJdbc.listAll(connection)
    }

  /** 按投稿 ID 列出审计记录（同一投稿可有多条，如复审/废止）。 */
  def listBySubmissionId(connection: Connection, submissionId: String): Vector[ReviewAuditRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.reviewAudits
        .filter(_.submissionId == submissionId)
        .sortBy(_.reviewedAt)(Ordering[String].reverse)
    } else {
      AdminAuditTableJdbc.listBySubmissionId(connection, submissionId)
    }

  /** 按审核人 ID 列出审计记录。 */
  def listByReviewerId(connection: Connection, reviewerId: String): Vector[ReviewAuditRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.reviewAudits
        .filter(_.reviewerId == reviewerId)
        .sortBy(_.reviewedAt)(Ordering[String].reverse)
    } else {
      AdminAuditTableJdbc.listByReviewerId(connection, reviewerId)
    }

  /** 生成下一个审计 ID。 */
  def nextId(connection: Connection): String =
    if (TableConnection.isInMemory(connection)) {
      s"review-audit-${InMemoryStore.reviewAudits.size + 1}"
    } else {
      AdminAuditTableJdbc.nextId(connection)
    }

  /** 插入审计记录（append-only，不更新历史行）。 */
  def insert(connection: Connection, row: ReviewAuditRow): ReviewAuditRow =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.reviewAudits = InMemoryStore.reviewAudits :+ row
      row
    } else {
      AdminAuditTableJdbc.insert(connection, row)
    }

  /** 便捷写入：自动生成 ID 并 insert。 */
  def recordReview(
    connection: Connection,
    targetType: String,
    submissionId: String,
    reviewerId: String,
    decision: String,
    reviewNote: Option[String],
    reviewedAt: String
  ): ReviewAuditRow =
    insert(
      connection,
      ReviewAuditRow(
        id = nextId(connection),
        targetType = targetType,
        submissionId = submissionId,
        reviewerId = reviewerId,
        decision = decision,
        reviewNote = reviewNote,
        reviewedAt = reviewedAt
      )
    )
}
