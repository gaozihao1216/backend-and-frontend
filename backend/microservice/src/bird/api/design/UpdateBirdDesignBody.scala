package microservice.bird.api.design

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** 更新鸟类设计请求体，字段与 CreateBirdDesignBody 一致。 */
final case class UpdateBirdDesignBody(
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

object UpdateBirdDesignBody {
  implicit val encoder: Encoder[UpdateBirdDesignBody] = deriveEncoder
  implicit val decoder: Decoder[UpdateBirdDesignBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, UpdateBirdDesignBody] = jsonOf
}
