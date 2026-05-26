package coursebackend.services.user.objects

import coursebackend.services.auth.objects.BackendUser
import coursebackend.services.level.objects.{Level, LevelComment}
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

final case class UserProfileStats(
  favoriteCount: Int,
  ratingCount: Int
)

object UserProfileStats {
  implicit val encoder: Encoder[UserProfileStats] = deriveEncoder
  implicit val decoder: Decoder[UserProfileStats] = deriveDecoder
}

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
