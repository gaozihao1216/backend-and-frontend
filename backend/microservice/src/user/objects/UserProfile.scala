package microservice.user.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.user.objects.profile.{UserProfileComment, UserProfilePublishedLevel}

/** 用户资料页聚合响应（profile 读模型）。 */
final case class UserProfile(
  user: BackendUser,
  publishedLevels: List[UserProfilePublishedLevel],
  recentComments: List[UserProfileComment],
  stats: UserProfileStats
)

private[user] object UserProfile {
  implicit val encoder: Encoder[UserProfile] = deriveEncoder
  implicit val decoder: Decoder[UserProfile] = deriveDecoder
}
