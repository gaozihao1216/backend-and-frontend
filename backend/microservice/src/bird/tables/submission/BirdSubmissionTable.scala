package microservice.bird.tables.submission

import microservice.bird.tables.shared.BirdSubmissionRow

import microservice.infrastructure.database.InMemoryStore
import microservice.system.objects.SubmissionStatus
import java.sql.Connection

/** 鸟类设计投稿表访问门面：记录 submit → review 流程，关联 bird_designs。
  *
  * 表：bird_submissions；状态使用 SubmissionStatus。
  * 关联：SubmitBirdDesignAPIMessage 创建、ReviewBirdSubmissionAPIMessage 审核。
  */
object BirdSubmissionTable {
  private def isInMemory(connection: Connection): Boolean = connection == null

  /** JDBC 启动时建表 bird_submissions；in-memory 模式跳过 DDL。 */
  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) {
      val statement = connection.createStatement()
      try {
        statement.executeUpdate(
          """
            CREATE TABLE IF NOT EXISTS bird_submissions (
              id TEXT PRIMARY KEY,
              bird_design_id TEXT NOT NULL REFERENCES bird_designs(id),
              submitter_id TEXT NOT NULL REFERENCES users(id),
              status TEXT NOT NULL,
              reviewer_id TEXT REFERENCES users(id),
              review_note TEXT,
              submitted_at TEXT NOT NULL,
              reviewed_at TEXT
            )
          """
        )
      } finally {
        statement.close()
      }
    }

  /** 生成下一个投稿 ID，格式 bird-submission-0001。 */
  def nextId(connection: Connection): String = {
    val count =
      if (isInMemory(connection)) InMemoryStore.birdSubmissions.size
      else {
        val statement = connection.prepareStatement("SELECT COUNT(*) AS submission_count FROM bird_submissions")
        try {
          val resultSet = statement.executeQuery()
          try if (resultSet.next()) resultSet.getInt("submission_count") else 0
          finally resultSet.close()
        } finally {
          statement.close()
        }
      }
    f"bird-submission-${count + 1}%04d"
  }

  /** 插入新投稿行。 */
  def insert(connection: Connection, row: BirdSubmissionRow): BirdSubmissionRow =
    if (isInMemory(connection)) {
      InMemoryStore.birdSubmissions = InMemoryStore.birdSubmissions :+ row
      row
    } else {
      val statement = connection.prepareStatement(
        """
          INSERT INTO bird_submissions (
            id, bird_design_id, submitter_id, status, reviewer_id, review_note, submitted_at, reviewed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """
      )
      try {
        statement.setString(1, row.id)
        statement.setString(2, row.birdDesignId)
        statement.setString(3, row.submitterId)
        statement.setString(4, row.status.value)
        row.reviewerId match {
          case Some(value) => statement.setString(5, value)
          case None => statement.setNull(5, java.sql.Types.VARCHAR)
        }
        row.reviewNote match {
          case Some(value) => statement.setString(6, value)
          case None => statement.setNull(6, java.sql.Types.VARCHAR)
        }
        statement.setString(7, row.submittedAt)
        row.reviewedAt match {
          case Some(value) => statement.setString(8, value)
          case None => statement.setNull(8, java.sql.Types.VARCHAR)
        }
        statement.executeUpdate()
        row
      } finally {
        statement.close()
      }
    }

  /** 按 submissionId 查询单条投稿。 */
  def findById(connection: Connection, submissionId: String): Option[BirdSubmissionRow] =
    if (isInMemory(connection)) InMemoryStore.birdSubmissions.find(_.id == submissionId)
    else {
      val statement = connection.prepareStatement(
        """
          SELECT id, bird_design_id, submitter_id, status, reviewer_id, review_note, submitted_at, reviewed_at
          FROM bird_submissions WHERE id = ?
        """
      )
      try {
        statement.setString(1, submissionId)
        val resultSet = statement.executeQuery()
        try if (resultSet.next()) Some(readSubmissionRow(resultSet)) else None
        finally resultSet.close()
      } finally {
        statement.close()
      }
    }

  /** 列出 PendingReview 状态的投稿，按 submitted_at 升序（先进先审）。 */
  def listPending(connection: Connection): Vector[BirdSubmissionRow] =
    if (isInMemory(connection)) {
      InMemoryStore.birdSubmissions.filter(_.status == SubmissionStatus.PendingReview)
    } else {
      val statement = connection.prepareStatement(
        """
          SELECT id, bird_design_id, submitter_id, status, reviewer_id, review_note, submitted_at, reviewed_at
          FROM bird_submissions
          WHERE status = ?
          ORDER BY submitted_at ASC, id ASC
        """
      )
      try {
        statement.setString(1, SubmissionStatus.PendingReview.value)
        val resultSet = statement.executeQuery()
        try {
          val builder = Vector.newBuilder[BirdSubmissionRow]
          while (resultSet.next()) builder += readSubmissionRow(resultSet)
          builder.result()
        } finally {
          resultSet.close()
        }
      } finally {
        statement.close()
      }
    }

  /** 检查某设计是否已有 PendingReview 投稿，防止重复 submit。 */
  def hasPendingForDesign(connection: Connection, designId: String): Boolean =
    if (isInMemory(connection)) {
      InMemoryStore.birdSubmissions.exists(row =>
        row.birdDesignId == designId && row.status == SubmissionStatus.PendingReview
      )
    } else {
      val statement = connection.prepareStatement(
        "SELECT 1 FROM bird_submissions WHERE bird_design_id = ? AND status = ?"
      )
      try {
        statement.setString(1, designId)
        statement.setString(2, SubmissionStatus.PendingReview.value)
        val resultSet = statement.executeQuery()
        try resultSet.next() finally resultSet.close()
      } finally {
        statement.close()
      }
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
      if (isInMemory(connection)) {
        InMemoryStore.birdSubmissions =
          InMemoryStore.birdSubmissions.filterNot(_.id == submissionId) :+ updated
        Some(updated)
      } else {
        val statement = connection.prepareStatement(
          """
            UPDATE bird_submissions
            SET status = ?, reviewer_id = ?, review_note = ?, reviewed_at = ?
            WHERE id = ?
          """
        )
        try {
          statement.setString(1, status.value)
          statement.setString(2, reviewerId)
          reviewNote match {
            case Some(value) => statement.setString(3, value)
            case None => statement.setNull(3, java.sql.Types.VARCHAR)
          }
          statement.setString(4, reviewedAt)
          statement.setString(5, submissionId)
          if (statement.executeUpdate() > 0) Some(updated) else None
        } finally {
          statement.close()
        }
      }
    }

  private def readSubmissionRow(resultSet: java.sql.ResultSet): BirdSubmissionRow =
    BirdSubmissionRow(
      id = resultSet.getString("id"),
      birdDesignId = resultSet.getString("bird_design_id"),
      submitterId = resultSet.getString("submitter_id"),
      status = SubmissionStatus.fromString(resultSet.getString("status")).getOrElse(SubmissionStatus.PendingReview),
      reviewerId = Option(resultSet.getString("reviewer_id")),
      reviewNote = Option(resultSet.getString("review_note")),
      submittedAt = resultSet.getString("submitted_at"),
      reviewedAt = Option(resultSet.getString("reviewed_at"))
    )
}
