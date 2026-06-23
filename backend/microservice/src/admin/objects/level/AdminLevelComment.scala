package microservice.admin.objects.level

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 管理员后台展示的关卡评论（admin 模块自有 DTO）。 */
final case class AdminLevelComment(
  id: String,
  levelId: String,
  userId: String,
  content: String,
  createdAt: String
)

private[admin] object AdminLevelComment {
  implicit val encoder: Encoder[AdminLevelComment] = deriveEncoder
  implicit val decoder: Decoder[AdminLevelComment] = deriveDecoder
}
