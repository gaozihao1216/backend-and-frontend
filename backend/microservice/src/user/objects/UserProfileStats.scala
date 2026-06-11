package microservice.user.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 资料页上的用户行为统计摘要。 */
final case class UserProfileStats(
  favoriteCount: Int, // 该用户收藏了多少关卡
  ratingCount: Int    // 该用户提交了多少条评分
)

object UserProfileStats {
  implicit val encoder: Encoder[UserProfileStats] = deriveEncoder
  implicit val decoder: Decoder[UserProfileStats] = deriveDecoder
}
