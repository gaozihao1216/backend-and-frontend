package microservice.user.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 资料页上的用户行为统计摘要。
  *
  * 定义：favoriteCount + ratingCount 两个 Int 计数。
  * 问题：资料页需展示社交活跃度，但不宜拉全量收藏/评分列表。
  * 作用：由 FavoriteTable.countByUser 与 RatingTable.countByPlayer 聚合。
  * 关联：嵌套于 [[UserProfile.stats]]；[[GetUserProfileAPIMessage]] 构造。
  */
final case class UserProfileStats(
  favoriteCount: Int, // 该用户收藏了多少关卡
  ratingCount: Int    // 该用户提交了多少条评分
)

object UserProfileStats {
  implicit val encoder: Encoder[UserProfileStats] = deriveEncoder
  implicit val decoder: Decoder[UserProfileStats] = deriveDecoder
}
