package microservice.level.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 玩家对关卡的评分记录。
  *
  * 字段说明：
  *   - id / levelId / playerId：评分标识与关联
  *   - score：1–5 分
  *   - createdAt / updatedAt：首次评分与最后更新时间
  */
final case class Rating(
  id: String,
  levelId: String,
  playerId: String,
  score: Int,
  createdAt: String,
  updatedAt: String
)

object Rating {
  implicit val encoder: Encoder[Rating] = deriveEncoder
  implicit val decoder: Decoder[Rating] = deriveDecoder
}
