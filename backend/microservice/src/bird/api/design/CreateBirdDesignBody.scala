package microservice.bird.api.design

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** 创建鸟类设计请求体：属性值、三档 tierSkills、可选预览图与机制标签。 */
final case class CreateBirdDesignBody(
  name: String,
  summary: String,
  skillName: String,
  attack: Int,
  impact: Int,
  speed: Int,
  tierSkills: List[String],
  previewImageUrl: Option[String] = None,
  mechanismTags: List[String] = List.empty
)

object CreateBirdDesignBody {
  implicit val encoder: Encoder[CreateBirdDesignBody] = deriveEncoder
  implicit val decoder: Decoder[CreateBirdDesignBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, CreateBirdDesignBody] = jsonOf
}
