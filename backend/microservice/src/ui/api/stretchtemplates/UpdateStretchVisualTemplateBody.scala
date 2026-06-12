package microservice.ui.api.stretchtemplates

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.ui.objects.StretchVisualTemplate
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** PUT panel-templates/:id 或 pattern-templates/:id 的请求体。 */
final case class UpdateStretchVisualTemplateBody(
  template: StretchVisualTemplate
)

object UpdateStretchVisualTemplateBody {
  implicit val encoder: Encoder[UpdateStretchVisualTemplateBody] = deriveEncoder
  implicit val decoder: Decoder[UpdateStretchVisualTemplateBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, UpdateStretchVisualTemplateBody] = jsonOf
}
