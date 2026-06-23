package microservice.user.objects.profile

import io.circe.Json
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.system.objects.{LevelStatus, LevelTag}

/** 用户资料页展示的已发布关卡（user 模块自有 DTO，JSON 形状与 level.Level 对齐）。 */
final case class UserProfilePublishedLevel(
  id: String,
  title: String,
  description: String,
  tags: List[LevelTag],
  data: Json,
  authorId: String,
  status: LevelStatus,
  rejectionReason: Option[String],
  averageRating: Double,
  ratingCount: Int,
  createdAt: String,
  updatedAt: String,
  publishedAt: Option[String]
)

private[user] object UserProfilePublishedLevel {
  implicit val encoder: Encoder[UserProfilePublishedLevel] = deriveEncoder
  implicit val decoder: Decoder[UserProfilePublishedLevel] = deriveDecoder
}

/** 用户资料页展示的最近评论（user 模块自有 DTO，JSON 形状与 level.LevelComment 对齐）。 */
final case class UserProfileComment(
  id: String,
  levelId: String,
  userId: String,
  content: String,
  createdAt: String
)

private[user] object UserProfileComment {
  implicit val encoder: Encoder[UserProfileComment] = deriveEncoder
  implicit val decoder: Decoder[UserProfileComment] = deriveDecoder
}
