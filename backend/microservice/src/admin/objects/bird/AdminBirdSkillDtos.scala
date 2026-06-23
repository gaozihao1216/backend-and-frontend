package microservice.admin.objects.bird

import io.circe.{Decoder, Encoder, Json}
import io.circe.generic.semiauto._

/** 总监技能看板单鸟条目（admin 模块自有 DTO）。 */
final case class AdminDirectorBirdSkillEntry(
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

private[admin] object AdminDirectorBirdSkillEntry {
  implicit val encoder: Encoder[AdminDirectorBirdSkillEntry] = deriveEncoder
  implicit val decoder: Decoder[AdminDirectorBirdSkillEntry] = deriveDecoder
}

/** 总监鸟类技能配置看板（admin 模块自有 DTO）。 */
final case class AdminDirectorBirdSkillBoard(
  birds: List[AdminDirectorBirdSkillEntry]
)

private[admin] object AdminDirectorBirdSkillBoard {
  implicit val encoder: Encoder[AdminDirectorBirdSkillBoard] = deriveEncoder
  implicit val decoder: Decoder[AdminDirectorBirdSkillBoard] = deriveDecoder
}

/** 已保存的鸟类技能配置（admin 模块自有 DTO）。 */
final case class AdminBirdSkillConfig(
  birdType: String,
  skills: Json,
  modelImageUrl: Option[String],
  updatedById: Option[String],
  updatedAt: String
)

private[admin] object AdminBirdSkillConfig {
  implicit val encoder: Encoder[AdminBirdSkillConfig] = deriveEncoder
  implicit val decoder: Decoder[AdminBirdSkillConfig] = deriveDecoder
}
