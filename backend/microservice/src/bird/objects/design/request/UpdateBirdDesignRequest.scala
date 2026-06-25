package microservice.bird.objects.design.request

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** PUT /designer/bird-designs/:designId 请求对象；字段语义见 [[microservice.bird.objects.design.BirdDesignInput]]。 */
final case class UpdateBirdDesignRequest(
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

private[bird] object UpdateBirdDesignRequest {
  implicit val encoder: Encoder[UpdateBirdDesignRequest] = deriveEncoder
  implicit val decoder: Decoder[UpdateBirdDesignRequest] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, UpdateBirdDesignRequest] = jsonOf
}
