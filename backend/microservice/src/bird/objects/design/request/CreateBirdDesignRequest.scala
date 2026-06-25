package microservice.bird.objects.design.request

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** POST /designer/bird-designs 请求对象；字段语义见 [[microservice.bird.objects.design.BirdDesignInput]]。 */
final case class CreateBirdDesignRequest(
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

private[bird] object CreateBirdDesignRequest {
  implicit val encoder: Encoder[CreateBirdDesignRequest] = deriveEncoder
  implicit val decoder: Decoder[CreateBirdDesignRequest] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, CreateBirdDesignRequest] = jsonOf
}
