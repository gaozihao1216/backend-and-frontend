package microservice.user.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.user.objects.BackendUser
import microservice.level.objects.level.{Level}
import microservice.level.objects.social.{LevelComment}

/** 用户资料页聚合响应（profile 层）。
  *
  * 组合 identity（BackendUser）与 level 模块的关卡、评论、统计，供 GET /users/:id/profile 返回。
  * 与前端 UserProfileSchema 对齐。
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
