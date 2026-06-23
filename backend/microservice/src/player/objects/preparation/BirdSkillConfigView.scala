package microservice.player.objects.preparation

import io.circe.Json

/** 备战页展示用的鸟类技能配置投影（player 模块边界 DTO）。 */
final case class BirdSkillConfigView(
  birdType: String,
  skills: Json,
  modelImageUrl: Option[String]
)
