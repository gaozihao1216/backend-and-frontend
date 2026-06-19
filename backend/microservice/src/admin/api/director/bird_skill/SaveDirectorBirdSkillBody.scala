package microservice.admin.api.director.bird_skill

import cats.effect.IO
import io.circe.{Decoder, Encoder, Json}
import io.circe.generic.semiauto._
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** 保存某鸟种技能 JSON 与可选模型图 URL 的请求体。 */
final case class SaveDirectorBirdSkillBody(
  skills: Json,
  modelImageUrl: Option[String] = None
)

object SaveDirectorBirdSkillBody {
  implicit val encoder: Encoder[SaveDirectorBirdSkillBody] = deriveEncoder
  implicit val decoder: Decoder[SaveDirectorBirdSkillBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, SaveDirectorBirdSkillBody] = jsonOf
}
