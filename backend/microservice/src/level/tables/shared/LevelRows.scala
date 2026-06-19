/** 关卡模块多个相关 Row case class 的聚合定义（shared 包）。
  *
  * 关联：JdbcRead/Codec 与 RowMapper 均依赖此处的行类型。
  */
package microservice.level.tables.shared

import microservice.level.objects.inventory.{BirdPool}
import microservice.level.objects.level.{LevelData}
import microservice.system.objects.{LevelStatus, LevelTag, SubmissionStatus}

final case class LevelRow(
  id: String,
  title: String,
  description: String,
  tags: List[LevelTag],
  data: LevelData,
  authorId: String,
  status: LevelStatus,
  rejectionReason: Option[String],
  averageRating: Double,
  ratingCount: Int,
  createdAt: String,
  updatedAt: String,
  publishedAt: Option[String]
)

final case class RatingRow(
  id: String,
  levelId: String,
  playerId: String,
  score: Int,
  createdAt: String,
  updatedAt: String
)

final case class CommentRow(
  id: String,
  levelId: String,
  userId: String,
  content: String,
  createdAt: String
)

final case class SubmissionRow(
  id: String,
  levelId: String,
  submitterId: String,
  status: SubmissionStatus,
  reviewerId: Option[String],
  reviewNote: Option[String],
  submittedAt: String,
  reviewedAt: Option[String]
)

final case class LevelSlotAssignmentRow(
  id: String,
  levelSuffix: String,
  submissionId: String,
  sourceLevelId: String,
  assignedById: String,
  assignedAt: String,
  note: Option[String],
  birdPool: Option[BirdPool] = None
)
