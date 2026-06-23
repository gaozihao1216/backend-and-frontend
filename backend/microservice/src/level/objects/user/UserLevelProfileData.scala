package microservice.level.objects.user

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 用户资料页 level 侧读聚合 handoff（供 user 模块 internal API 消费）。 */
final case class UserLevelProfileData(
  publishedLevels: List[ProfileLevelSnapshot],
  recentComments: List[ProfileCommentSnapshot],
  favoriteCount: Int,
  ratingCount: Int
)

private[level] object UserLevelProfileData {
  implicit val encoder: Encoder[UserLevelProfileData] = deriveEncoder
  implicit val decoder: Decoder[UserLevelProfileData] = deriveDecoder
}
