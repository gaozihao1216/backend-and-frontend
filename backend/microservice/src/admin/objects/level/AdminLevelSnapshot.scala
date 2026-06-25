package microservice.admin.objects.level

import io.circe.Json
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.system.objects.enums.{LevelStatus, LevelTag}

/** 管理员后台展示的关卡快照（admin 模块自有 DTO）。 */
final case class AdminLevelSnapshot(
  id: String,
  title: String,
  description: String,
  tags: List[LevelTag],
  data: Json,
  authorId: String,
  status: LevelStatus,
  rejectionReason: Option[String],
  averageRating: Double,
  ratingCount: Int,
  createdAt: String,
  updatedAt: String,
  publishedAt: Option[String]
)

private[admin] object AdminLevelSnapshot {
  implicit val encoder: Encoder[AdminLevelSnapshot] = deriveEncoder
  implicit val decoder: Decoder[AdminLevelSnapshot] = deriveDecoder
}
