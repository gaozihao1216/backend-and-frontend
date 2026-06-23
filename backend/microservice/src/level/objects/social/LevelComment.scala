package microservice.level.objects.social

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 玩家对关卡的评论。
  *
  * 字段说明：
  *   - id / levelId / userId：评论标识与关联
  *   - content：评论正文
  *   - createdAt：发表时间
  */
final case class LevelComment(
  id: String,
  levelId: String,
  userId: String,
  content: String,
  createdAt: String
)

/** LevelComment 伴生对象：Circe JSON 编解码，供评论 API 响应。 */
private[level] object LevelComment {
  implicit val encoder: Encoder[LevelComment] = deriveEncoder
  implicit val decoder: Decoder[LevelComment] = deriveDecoder
}
