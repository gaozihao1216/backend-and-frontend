package microservice.ui.api.stretchtemplates

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.ui.objects.StretchVisualTemplate
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** POST panel-templates / pattern-templates 的请求体。 */
final case class CreateStretchVisualTemplateBody(
  template: StretchVisualTemplate
)

object CreateStretchVisualTemplateBody {
  implicit val encoder: Encoder[CreateStretchVisualTemplateBody] = deriveEncoder
  implicit val decoder: Decoder[CreateStretchVisualTemplateBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, CreateStretchVisualTemplateBody] = jsonOf
}
