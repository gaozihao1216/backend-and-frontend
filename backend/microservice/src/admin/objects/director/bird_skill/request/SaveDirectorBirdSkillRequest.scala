package microservice.admin.objects.director.bird_skill.request

import cats.effect.IO
import io.circe.{Decoder, Encoder, Json}
import io.circe.generic.semiauto._
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** 保存某鸟种技能配置的请求对象；字段语义见 [[microservice.bird.objects.skill.config.BirdSkillConfig]]。 */
final case class SaveDirectorBirdSkillRequest(
  skills: Json,
  modelImageUrl: Option[String] = None
)

/** SaveDirectorBirdSkillRequest 的 Circe/http4s 编解码 companion。 */
private[admin] object SaveDirectorBirdSkillRequest {
  implicit val encoder: Encoder[SaveDirectorBirdSkillRequest] = deriveEncoder
  implicit val decoder: Decoder[SaveDirectorBirdSkillRequest] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, SaveDirectorBirdSkillRequest] = jsonOf
}
