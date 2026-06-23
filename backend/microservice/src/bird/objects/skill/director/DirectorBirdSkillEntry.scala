package microservice.bird.objects.skill.director

import io.circe.{Decoder, Encoder, Json}
import io.circe.generic.semiauto._

/** 总监技能看板中的单鸟条目：合并 catalog 元数据与可选已配置 skills JSON。
  *
  * 字段说明：
  *   - configured：BirdSkillConfigTable 中是否已有该 birdType 的配置
  *   - skills：已配置时的 skills JSON；未配置时为 None
  *   - modelImageUrl：已配置时用库中 URL，否则回退 catalog 预览图
  *
  * 关联：GetDirectorBirdSkillAPIMessage / GetDirectorBirdSkillBoardAPIMessage 响应元素。
  */
final case class DirectorBirdSkillEntry(
  birdType: String,
  name: String,
  source: String,
  authorId: Option[String],
  skillName: String,
  tierSkillDescriptions: List[String],
  configured: Boolean,
  skills: Option[Json],
  modelImageUrl: Option[String]
)

object DirectorBirdSkillEntry {
  implicit val encoder: Encoder[DirectorBirdSkillEntry] = deriveEncoder
  implicit val decoder: Decoder[DirectorBirdSkillEntry] = deriveDecoder
}
