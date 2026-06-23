package microservice.bird.api.design.body

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** POST /designer/bird-designs 请求体；字段语义见 [[microservice.bird.objects.design.BirdDesignInput]]。 */
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
