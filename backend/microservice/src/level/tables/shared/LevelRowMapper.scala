package microservice.level.tables.shared

import microservice.level.objects.level.{Level}
import microservice.level.objects.social.{LevelComment, Rating}
import microservice.level.objects.submission.{Submission}

/** 持久化 Row 与领域对象之间的映射器。
  *
  * 实现：纯字段拷贝，不含业务逻辑；Table 层返回 Row，API 层通过此对象转为对外 DTO。
  * 关联：所有 level 模块 APIMessage 在返回前均经此转换。
  */
object LevelRowMapper {
  /** LevelRow → Level 领域对象。 */
  def toLevel(row: LevelRow): Level =
    Level(
      row.id,
      row.title,
      row.description,
      row.tags,
      row.data,
      row.authorId,
      row.status,
      row.rejectionReason,
      row.averageRating,
      row.ratingCount,
      row.createdAt,
      row.updatedAt,
      row.publishedAt
    )

  /** RatingRow → Rating 领域对象。 */
  def toRating(row: RatingRow): Rating =
    Rating(row.id, row.levelId, row.playerId, row.score, row.createdAt, row.updatedAt)

  /** CommentRow → LevelComment 领域对象。 */
  def toComment(row: CommentRow): LevelComment =
    LevelComment(row.id, row.levelId, row.userId, row.content, row.createdAt)

  /** SubmissionRow → Submission 领域对象。 */
  def toSubmission(row: SubmissionRow): Submission =
    Submission(
      row.id,
      row.levelId,
      row.submitterId,
      row.status,
      row.reviewerId,
      row.reviewNote,
      row.submittedAt,
      row.reviewedAt
    )
}
