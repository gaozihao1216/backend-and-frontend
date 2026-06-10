package microservice.user.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.user.objects.BackendUser
import microservice.level.objects.{Level, LevelComment}

final case class UserProfile(
  user: BackendUser,
  publishedLevels: List[Level],
  recentComments: List[LevelComment],
  stats: UserProfileStats
)

object UserProfile {
  implicit val encoder: Encoder[UserProfile] = deriveEncoder
  implicit val decoder: Decoder[UserProfile] = deriveDecoder
}
