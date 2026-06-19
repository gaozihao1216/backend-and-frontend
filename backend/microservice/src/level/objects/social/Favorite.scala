package microservice.level.objects.social

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 玩家收藏关卡的记录。
  *
  * 字段说明：
  *   - id / levelId / userId：收藏标识与关联
  *   - createdAt：收藏时间
  */
final case class Favorite(
  id: String,
  levelId: String,
  userId: String,
  createdAt: String
)

object Favorite {
  implicit val encoder: Encoder[Favorite] = deriveEncoder
  implicit val decoder: Decoder[Favorite] = deriveDecoder
}
