package microservice.bird.body.design

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** PUT /designer/bird-designs/:designId 请求体；字段语义见 [[microservice.bird.objects.design.BirdDesignInput]]。 */
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
