package microservice.bird.objects.skill.director

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 总监鸟类技能配置看板：全部可选鸟种及其配置状态。
  *
  * 关联：GetDirectorBirdSkillBoardAPIMessage 响应体。
  */
final case class DirectorBirdSkillBoard(
  birds: List[DirectorBirdSkillEntry]
)

/** DirectorBirdSkillBoard 伴生对象：Circe JSON 编解码（总监技能配置看板 API 响应）。 */
private[bird] object DirectorBirdSkillBoard {
  implicit val encoder: Encoder[DirectorBirdSkillBoard] = deriveEncoder
  implicit val decoder: Decoder[DirectorBirdSkillBoard] = deriveDecoder
}
