package microservice.user.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.user.objects.BackendUser
import microservice.level.objects.level.{Level}
import microservice.level.objects.social.{LevelComment}

/** 用户资料页聚合响应（profile 读模型）。
  *
  * 定义：BackendUser + 已发布关卡 + 最近评论 + UserProfileStats 四段组合。
  * 问题：资料页需跨 level/comment/favorite/rating 多表聚合，不宜让前端多次请求。
  * 作用：GET /users/:id/profile 一次性返回展示所需数据。
  * 关联：[[GetUserProfileAPIMessage]]；前端 UserProfileSchema。
  */
final case class UserProfile(
  user: BackendUser,                    // 用户基本信息
  publishedLevels: List[Level],         // 该用户作为作者已发布的关卡
  recentComments: List[LevelComment],   // 最近评论摘要
  stats: UserProfileStats               // 收藏数、评分数等计数
)

object UserProfile {
  implicit val encoder: Encoder[UserProfile] = deriveEncoder
  implicit val decoder: Decoder[UserProfile] = deriveDecoder
}
