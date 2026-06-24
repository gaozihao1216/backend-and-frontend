package microservice.admin.body.director.bird_skill

import cats.effect.IO
import io.circe.{Decoder, Encoder, Json}
import io.circe.generic.semiauto._
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** 保存某鸟种技能配置的请求体；字段语义见 [[microservice.bird.objects.skill.config.BirdSkillConfig]]。 */
final case class SaveDirectorBirdSkillBody(
  skills: Json,
  modelImageUrl: Option[String] = None
)

/** SaveDirectorBirdSkillBody 的 Circe/http4s 编解码 companion。 */
private[admin] object SaveDirectorBirdSkillBody {
  implicit val encoder: Encoder[SaveDirectorBirdSkillBody] = deriveEncoder
  implicit val decoder: Decoder[SaveDirectorBirdSkillBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, SaveDirectorBirdSkillBody] = jsonOf
}
