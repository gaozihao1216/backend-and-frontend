package microservice.bird.tables.submission

import java.sql.Connection
import microservice.bird.tables.shared.BirdSubmissionRow
import microservice.bird.tables.submission.jdbc.BirdSubmissionTableJdbc
import microservice.infrastructure.database.{InMemoryStore, TableConnection}
import microservice.system.objects.SubmissionStatus

/** 鸟类设计投稿表访问门面：记录 submit → review 流程，关联 bird_designs。
  *
  * 表：bird_submissions；状态使用 SubmissionStatus。
  * 关联：SubmitBirdDesignAPIMessage 创建、ReviewBirdSubmissionAPIMessage 审核。
  */
object BirdSubmissionTable {
  /** JDBC 启动时建表 bird_submissions；in-memory 模式跳过 DDL。 */
  def initialize(connection: Connection): Unit =
    if (!TableConnection.isInMemory(connection)) BirdSubmissionTableJdbc.initialize(connection)

  /** 生成下一个投稿 ID，格式 bird-submission-0001。 */
  def nextId(connection: Connection): String =
    if (TableConnection.isInMemory(connection)) {
      f"bird-submission-${InMemoryStore.birdSubmissions.size + 1}%04d"
    } else {
      BirdSubmissionTableJdbc.nextId(connection)
    }

  /** 插入新投稿行。 */
  def insert(connection: Connection, row: BirdSubmissionRow): BirdSubmissionRow =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.birdSubmissions = InMemoryStore.birdSubmissions :+ row
      row
    } else {
      BirdSubmissionTableJdbc.insert(connection, row)
    }

  /** 按 submissionId 查询单条投稿。 */
  def findById(connection: Connection, submissionId: String): Option[BirdSubmissionRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.birdSubmissions.find(_.id == submissionId)
    } else {
      BirdSubmissionTableJdbc.findById(connection, submissionId)
    }

  /** 列出 PendingReview 状态的投稿，按 submitted_at 升序（先进先审）。 */
  def listPending(connection: Connection): Vector[BirdSubmissionRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.birdSubmissions.filter(_.status == SubmissionStatus.PendingReview)
    } else {
      BirdSubmissionTableJdbc.listPending(connection)
    }

  /** 检查某设计是否已有 PendingReview 投稿，防止重复 submit。 */
  def hasPendingForDesign(connection: Connection, designId: String): Boolean =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.birdSubmissions.exists(row =>
        row.birdDesignId == designId && row.status == SubmissionStatus.PendingReview
      )
    } else {
      BirdSubmissionTableJdbc.hasPendingForDesign(connection, designId)
    }

  /** 写入审核结果：更新 status、reviewerId、reviewNote、reviewedAt。 */
  def updateReview(
    connection: Connection,
    submissionId: String,
    status: SubmissionStatus,
    reviewerId: String,
    reviewNote: Option[String],
    reviewedAt: String
  ): Option[BirdSubmissionRow] =
    findById(connection, submissionId).flatMap { existing =>
      val updated = existing.copy(
        status = status,
        reviewerId = Some(reviewerId),
        reviewNote = reviewNote,
        reviewedAt = Some(reviewedAt)
      )
      if (TableConnection.isInMemory(connection)) {
        Some(updateInMemoryRow(updated))
      } else if (BirdSubmissionTableJdbc.updateReview(connection, submissionId, status, reviewerId, reviewNote, reviewedAt)) {
        Some(updated)
      } else None
    }

  private def updateInMemoryRow(row: BirdSubmissionRow): BirdSubmissionRow = {
    InMemoryStore.birdSubmissions =
      InMemoryStore.birdSubmissions.filterNot(_.id == row.id) :+ row
    row
  }
}
