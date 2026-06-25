package microservice.level.objects.user

import io.circe.Json
import io.circe.generic.semiauto._
import io.circe.syntax._
import io.circe.{Decoder, Encoder}
import microservice.level.objects.core.Level
import microservice.level.objects.social.LevelComment
import microservice.system.objects.enums.{LevelStatus, LevelTag}

/** 用户资料页关卡投影（level 模块 handoff DTO）。 */
final case class ProfileLevelSnapshot(
  id: String,
  title: String,
  description: String,
  tags: List[LevelTag],
  dataJson: Json,
  authorId: String,
  status: LevelStatus,
  rejectionReason: Option[String],
  averageRating: Double,
  ratingCount: Int,
  createdAt: String,
  updatedAt: String,
  publishedAt: Option[String]
)

private[level] object ProfileLevelSnapshot {
  import microservice.level.objects.codec.LevelCrossModuleCodecs._
  import microservice.level.objects.core.LevelData
  import io.circe.syntax._

  def from(level: Level): ProfileLevelSnapshot =
    ProfileLevelSnapshot(
      id = level.id,
      title = level.title,
      description = level.description,
      tags = level.tags,
      dataJson = level.data.asJson,
      authorId = level.authorId,
      status = level.status,
      rejectionReason = level.rejectionReason,
      averageRating = level.averageRating,
      ratingCount = level.ratingCount,
      createdAt = level.createdAt,
      updatedAt = level.updatedAt,
      publishedAt = level.publishedAt
    )

  implicit val encoder: Encoder[ProfileLevelSnapshot] = deriveEncoder
  implicit val decoder: Decoder[ProfileLevelSnapshot] = deriveDecoder
}

/** 用户资料页评论投影（level 模块 handoff DTO）。 */
final case class ProfileCommentSnapshot(
  id: String,
  levelId: String,
  userId: String,
  content: String,
  createdAt: String
)

private[level] object ProfileCommentSnapshot {
  def from(comment: LevelComment): ProfileCommentSnapshot =
    ProfileCommentSnapshot(
      id = comment.id,
      levelId = comment.levelId,
      userId = comment.userId,
      content = comment.content,
      createdAt = comment.createdAt
    )

  implicit val encoder: Encoder[ProfileCommentSnapshot] = deriveEncoder
  implicit val decoder: Decoder[ProfileCommentSnapshot] = deriveDecoder
}
