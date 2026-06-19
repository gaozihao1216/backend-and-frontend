package microservice.bird.objects.skill

import io.circe.{Decoder, Encoder, Json}
import io.circe.generic.semiauto._

/** 总监配置的鸟类技能 JSON 持久化模型（按 birdType 唯一）。
  *
  * 关联：BirdSkillConfigTable；SaveDirectorBirdSkillAPIMessage 写入；玩家备战/运行时读取。
  */
final case class BirdSkillConfig(
  birdType: String,
  skills: Json,
  modelImageUrl: Option[String],
  updatedById: Option[String],
  updatedAt: String
)

object BirdSkillConfig {
  implicit val encoder: Encoder[BirdSkillConfig] = deriveEncoder
  implicit val decoder: Decoder[BirdSkillConfig] = deriveDecoder
}

/** 总监技能看板中的单鸟条目：合并 catalog 元数据与可选已配置 skills JSON。 */
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

/** 总监鸟类技能配置看板：全部可选鸟种及其配置状态。 */
final case class DirectorBirdSkillBoard(
  birds: List[DirectorBirdSkillEntry]
)

object DirectorBirdSkillBoard {
  implicit val encoder: Encoder[DirectorBirdSkillBoard] = deriveEncoder
  implicit val decoder: Decoder[DirectorBirdSkillBoard] = deriveDecoder
}
