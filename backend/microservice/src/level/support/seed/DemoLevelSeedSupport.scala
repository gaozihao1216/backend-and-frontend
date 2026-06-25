package microservice.level.support.seed

import java.sql.Connection
import microservice.level.tables.comment.CommentTable
import microservice.level.tables.level.LevelTable
import microservice.level.tables.rating.RatingTable
import microservice.level.tables.submission.SubmissionTable
import microservice.level.tables.shared.{CommentRow, LevelRow, RatingRow, SubmissionRow}
import microservice.system.objects.enums.{LevelStatus, LevelTag, SubmissionStatus}

/** 演示关卡/投稿/评分/评论种子（level 模块内）。 */
private[level] object DemoLevelSeedSupport {
  val jdbcDemoTimestamp: String = "2026-06-03T00:00:00Z"

  def levels(createdAt: String): Vector[LevelRow] =
    Vector(
      LevelRow(
        id = "level-1",
        title = "Starter Siege",
        description = "Published sample level for profile and rating demos.",
        tags = List(LevelTag.Beginner, LevelTag.Puzzle),
        data = DemoLevelDataFactory.demoLevelData,
        authorId = "designer-1",
        status = LevelStatus.Published,
        rejectionReason = None,
        averageRating = 4.0,
        ratingCount = 1,
        createdAt = createdAt,
        updatedAt = createdAt,
        publishedAt = Some(createdAt)
      ),
      LevelRow(
        id = "level-2",
        title = "Pending Glass Tower",
        description = "Pending review sample for admin demo.",
        tags = List(LevelTag.Hard),
        data = DemoLevelDataFactory.demoLevelData,
        authorId = "designer-1",
        status = LevelStatus.PendingReview,
        rejectionReason = None,
        averageRating = 0,
        ratingCount = 0,
        createdAt = createdAt,
        updatedAt = createdAt,
        publishedAt = None
      )
    )

  def submissions(createdAt: String, reviewedAt: String): Vector[SubmissionRow] =
    Vector(
      SubmissionRow(
        id = "submission-1",
        levelId = "level-1",
        submitterId = "designer-1",
        status = SubmissionStatus.Approved,
        reviewerId = Some("admin-1"),
        reviewNote = Some("Published as baseline sample."),
        submittedAt = createdAt,
        reviewedAt = Some(reviewedAt)
      ),
      SubmissionRow(
        id = "submission-2",
        levelId = "level-2",
        submitterId = "designer-1",
        status = SubmissionStatus.PendingReview,
        reviewerId = None,
        reviewNote = None,
        submittedAt = createdAt,
        reviewedAt = None
      )
    )

  def ratings(createdAt: String): Vector[RatingRow] =
    Vector(RatingRow("rating-1", "level-1", "player-1", 4, createdAt, createdAt))

  def comments(createdAt: String): Vector[CommentRow] =
    Vector(CommentRow("comment-1", "level-1", "player-1", "Solid tutorial pacing.", createdAt))

  /** JDBC 模式幂等写入演示 level 侧数据。 */
  def seedJdbcIfEmpty(connection: Connection, createdAt: String, reviewedAt: String): Unit = {
    levels(createdAt).foreach { row =>
      if (LevelTable.findById(connection, row.id).isEmpty) {
        LevelTable.insert(connection, row)
      }
    }

    submissions(createdAt, reviewedAt).foreach { row =>
      if (SubmissionTable.findById(connection, row.id).isEmpty) {
        SubmissionTable.insert(connection, row)
      }
    }

    ratings(createdAt).foreach { row =>
      if (RatingTable.findByLevelAndPlayer(connection, row.levelId, row.playerId).isEmpty) {
        RatingTable.insert(connection, row)
      }
    }

    comments(createdAt).foreach { row =>
      val exists =
        CommentTable.listByLevel(connection, row.levelId).exists(_.id == row.id)
      if (!exists) {
        CommentTable.insert(connection, row)
      }
    }
  }
}
