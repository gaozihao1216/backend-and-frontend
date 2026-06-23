package microservice.bird.objects.skill.config

import io.circe.{Decoder, Encoder, Json}
import io.circe.generic.semiauto._

/** 总监配置的鸟类技能 JSON 持久化模型（按 birdType 唯一）。
  *
  * 字段说明：
  *   - skills：技能 JSON，须含非空 `stages` 数组；由 DirectorBirdSkillSupport.checkSkillsJson 校验
  *   - modelImageUrl：可选 3D/预览模型图 URL；空字符串在写入时会被过滤
  *   - updatedById / updatedAt：最近一次写入的总监用户 ID 与 ISO 时间戳
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
