/** 鸟设计模块多个相关 Row case class 的聚合定义（shared 包）。
  *
  * 关联：JdbcRead/Codec 与 RowMapper 均依赖此处的行类型。
  */
package microservice.bird.tables.shared

import microservice.system.objects.{LevelStatus, SubmissionStatus}

final case class BirdDesignRow(
  id: String,
  authorId: String,
  name: String,
  summary: String,
  skillName: String,
  attack: Int,
  impact: Int,
  speed: Int,
  tierSkillsJson: String,
  previewImageUrl: String,
  mechanismTagsJson: String,
  status: LevelStatus,
  rejectionReason: Option[String],
  createdAt: String,
  updatedAt: String,
  publishedAt: Option[String]
)

final case class BirdSubmissionRow(
  id: String,
  birdDesignId: String,
  submitterId: String,
  status: SubmissionStatus,
  reviewerId: Option[String],
  reviewNote: Option[String],
  submittedAt: String,
  reviewedAt: Option[String]
)
