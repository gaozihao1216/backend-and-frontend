package microservice.user.objects

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
