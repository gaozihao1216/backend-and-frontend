package microservice.bird.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.system.objects.LevelStatus

/** 设计师创建的鸟类设计领域对象，复用 LevelStatus 表示生命周期（Draft → PendingReview → Published/Rejected）。
  *
  * 关联：BirdDesignTable / BirdRowMapper；前端 objects/bird/BirdDesign.ts schema 对齐。
  */
final case class BirdDesign(
  id: String,
  authorId: String,
  name: String,
  summary: String,
  skillName: String,
  attack: Int,
  impact: Int,
  speed: Int,
  tierSkills: List[String],
  previewImageUrl: String,
  mechanismTags: List[String],
  status: LevelStatus,
  rejectionReason: Option[String],
  createdAt: String,
  updatedAt: String,
  publishedAt: Option[String]
)

object BirdDesign {
  implicit val encoder: Encoder[BirdDesign] = deriveEncoder
  implicit val decoder: Decoder[BirdDesign] = deriveDecoder
}
